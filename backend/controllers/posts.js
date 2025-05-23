import { ObjectId } from "mongodb";
import usersController from "./users.js";
import validation from "../utils/validation.js";
import settings from "../models/settings.js";
import cloudinary from "../cloudinary/cloudinary.js";
import Post from "../models/post.js";
import elasticClient from "../elasticSearch/elasticsearchClient.js";
import createIndex from "../elasticSearch/createPostIndex.js";
import userController from "./users.js";
import commentsController from "./comments.js";
import { sendNotification } from "./notification.js";
import redisUtils from "../redis/redisUtils.js";
// delete post... make sure an admin can do it no matter what!

async function getNPosts(n) {
  //console.log("1");
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .populate("sender", "name username email profile friends uid")
    .lean();

  //console.log("2");
  return posts;
}

async function getModPosts() {
  const posts = await Post.find({ "reports.reportNum": { $gte: 5 } })
    .sort({ createdAt: -1 })
    .populate("sender", "name username email profile friends uid")
    .lean();

  return posts;
}

// post posts, pretty simple
async function postPost(uid, text, attachments, isPrivate) {
  let user = await usersController.getUserByUID(uid);
  validation.validateBoolean(isPrivate);

  text = validation.validateString(text);
  if (text.length > settings.MESSAGE_LENGTH)
    throw new Error("text is too long!");

  let newPost = {
    sender: user._id,
    senderName: user.name,
    senderUsername: user.username,
    senderProfile: user.profile,
    text: text,
    attachments: [],
    isPrivate: isPrivate,
    likes: [],
    comments: [],
    reports: { reporters: [], reportTypes: [], comments: [], reportNum: 0 },
  };

  if (attachments) {
    for (const attachment of attachments) {
      cloudinary.validateCloudinaryObject(attachment);
      newPost.attachments.push(attachment);
    }
  }

  const post = await Post.create(newPost);
  await elasticClient.index({
    index: "posts",
    id: post._id.toString(),
    body: {
      uid,
      text,
      isPrivate,
      senderUsername: user.username,
      senderName: user.name,
      createdAt: new Date().toISOString(),
    },
  });

  if (user.friends.length > 0) {
    for (const friendId of user.friends) {
      console.log("Notification Sending System Executed...");
      const friendDetails = await userController.getUserById(friendId);
      const result = await sendNotification(friendId, friendDetails.uid, "", {
        type: "new-post",
        title: `A new post from ${user.name}`,
        body: "",
        link: `/posts/${post._id}`,
      });
    }
  }

  return post;
}

// check if you can even delete a message to begin with
// probably useful for UI
async function canDeletePost(uid, postID) {
  let post = await getPostById(postID.toString());
  let user = await usersController.getUserByUID(uid);

  // if the user is an admin we can ignore these checks
  console.log("delte post user: ", post.sender);
  if (
    user.role != "admin" &&
    user._id.toString() != post.sender._id.toString()
  ) {
    console.log("User isn't poster or admin");
    return false;
  }

  console.log("User is admin OR poster!");
  return true;
}

async function deletePost(uid, postID) {
  let post = await getPostById(postID.toString());
  let user = await usersController.getUserByUID(uid);

  let canDel = await canDeletePost(uid, postID);
  if (!canDel) throw new Error("You don't have permissions to delete this!");
  const commentIds = post.comments;
  console.log("My commentIDs", commentIds);
  for (const commentId of commentIds) {
    try {
      await commentsController.deleteCommentAnyway(uid, commentId.toString());
    } catch (e) {
      console.error(`Failed to delete comment ${commentId}:`, e);
    }
  }
  await Post.deleteOne({ _id: post._id });
  await elasticClient.delete({
    index: "posts",
    id: post._id.toString(),
  });
  await redisUtils.unsetJSON(`posts/${post._id.toString()}`);
}

// there's no "canEditPost" function because you can only edit if you're the poster
async function editPost(uid, postID, text, isPrivate, updateTimestamps) {
  let post = await getPostById(postID.toString());
  let user = await usersController.getUserByUID(uid);
  validation.validateBoolean(isPrivate);

  console.log(post.sender, user._id);
  if (post.sender._id.toString() != user._id.toString())
    throw new Error("You can't edit this post!");

  if (text) {
    text = validation.validateString(text);
    if (text.length > settings.MESSAGE_LENGTH)
      throw new Error("text is too long!");

    post = await Post.findOneAndUpdate(
      { _id: post._id.toString(), sender: user._id.toString() },
      {
        $set: {
          text: text,
        },
      },
      { new: true, timestamps: updateTimestamps }
    );
  }

  /*if(attachments){
        validation.validateArray(attachments, "Post attachments");
        
        let media = [];

        for (const attachment of attachments) {
            cloudinary.validateCloudinaryObject(attachment);
            media.push(attachment);
        }

        post = await Post.findOneAndUpdate(
            {_id: post._id, sender: user._id},
            {
                $set: {
                    attachments: media
                }
            },
            { new: true , timestamps: updateTimestamps }
        );
    }*/

  post = await Post.findOneAndUpdate(
    { _id: post._id, sender: user._id },
    {
      $set: {
        isPrivate: isPrivate,
      },
    },
    { new: true, timestamps: updateTimestamps }
  );
  await elasticClient.update({
    index: "posts",
    id: post._id,
    body: {
      doc: {
        text: text,
        isPrivate: isPrivate,
        updatedAt: new Date(),
      },
    },
  });

  await redisUtils.unsetJSON(`posts/${post._id.toString()}`);
  return post;
}

// you can't like a post multiple times or like your own post
async function likePost(uid, postId) {
  let post = await getPostById(postId.toString());
  let user = await usersController.getUserByUID(uid);
  // console.log("sender man", post.sender)
  // console.log("user", user._id)
  let postOwnerInfo = await userController.getUserById(
    post.sender._id.toString()
  );

  if (user._id.toString() == post.sender._id.toString())
    throw new Error("you can't like your own post!");

  let likez = post.likes.map((id) => id.toString());
  console.log("likes before", likez);
  let updatedLikes;
  let isLiked;
  // return false?
  if (likez.includes(user._id.toString())) {
    updatedLikes = post.likes.filter(
      (id) => id.toString() !== user._id.toString()
    );
    isLiked = false;
  } else {
    updatedLikes = [...post.likes, user._id];
    isLiked = true;
    const postOwnerInfo = await userController.getUserById(
      post.sender._id.toString()
    );
    await sendNotification(post.sender, postOwnerInfo.uid, "", {
      title: `${user.name} liked your post`,
      body: "",
      type: "post-liked",
      link: `/posts/${postId}`,
    });
  }
  console.log("likes after", likez);
  console.log("post", updatedLikes);
  post = await Post.findOneAndUpdate(
    { _id: post._id },
    {
      $set: {
        likes: updatedLikes,
      },
    },
    { new: true }
  );
  await redisUtils.unsetJSON(`posts/${post._id.toString()}`);

  // await sendNotification(post.sender, postOwnerInfo.uid, "", {
  //   title: `${user.name} liked your post`,
  //   body: "",
  //   type: "post-liked",
  //   link: `/posts/${postId}`,
  // });

  return {
    post,
    isLiked,
  };
}

// report the post
// you can't report your own post or report it multiple times
async function reportPost(uid, postId, reportType, comment) {
  let post = await getPostById(postId.toString());
  let user = await usersController.getUserByUID(uid);
  let com = "";
  await redisUtils.unsetJSON(`posts/${post._id.toString()}`);

  if (user._id.toString() == post.sender.toString())
    throw new Error("how did you even manage to report your own post?!");

  reportType = validation.validateString(reportType);
  if (!settings.REPORT_TYPES.includes(reportType))
    throw new Error("this report type doesn't exist!");

  let reporterz = post.reports.reporters;
  if (reporterz.includes(user._id))
    throw new Error("You've already reported this post!");

  let reportTypez = post.reports.reportTypes;
  //let reportNum = 0;

  reporterz.push(user._id);
  reportTypez.push(reportType);

  if (comment) {
    comment = validation.validateString(comment);
    if (comment.length > settings.MESSAGE_LENGTH)
      throw new Error("text is too long!");
    com = comment;
  }

  let commenz = post.reports.comments;
  commenz.push(com);

  let reportN = post.reports.reportNum;
  reportN += 1;

  post = await Post.findOneAndUpdate(
    { _id: post._id },
    {
      $set: {
        reports: {
          reporters: reporterz,
          reportTypes: reportTypez,
          comments: commenz,
          reportNum: reportN,
        },
      },
    },
    { new: true }
  );

  console.log("report count: ", post.reports.reporters.length);
  if (post.reports.reporters.length >= 5) {
    console.log(process.env.ADMIN_ID, process.env.ADMIN_UID);
    await sendNotification(process.env.ADMIN_ID, process.env.ADMIN_UID, "", {
      title: `Post (${post._id.toString()}) has been flagged a lot!`,
      body: `Post was send by ${post.senderName}`,
      type: "system",
      link: `/posts/${post._id.toString()}`,
    });
  }
  await redisUtils.unsetJSON(`posts/${post._id.toString()}`);

  return post;
}

async function getPostById(postId, useCache) {
  postId = validation.validateString(postId, "Post Id", true);
  postId = ObjectId.createFromHexString(postId);
  let post;

  if (useCache) {
    post = await redisUtils.getJSON(`posts/${postId}`);
    if (post) {
      return post;
    }
  }

  post = await Post.findById(postId).populate(
    "sender",
    "name username email profile friends uid"
  );

  if (!post) {
    throw `No post with id (${post})!`;
  }
  await redisUtils.cacheJSON(`posts/${postId}`, post, 3600);
  return post;
}

// if a post is private, you need to be either the user, their friend, or an admin to see it
async function canSeePost(uid, postID) {
  let post = await getPostById(postID.toString());
  let user = await usersController.getUserByUID(uid);

  if (!post.isPrivate) return true; // oh cool the post is public

  if (post.sender.toString() == user._id.toString()) return true; // oh cool you're the poster

  if (user.role == "admin") return true; // oh cool you're an admin

  let poster = await usersController.getUserById(post.sender.toString());
  if (poster.friends.includes(user._id)) return true; // oh cool you're one of their friends

  return false; // dammit
}
async function findMutualFriend(user) {
  let friendIds = (user?.friends || []).map((id) => id._id.toString());
  let finalArray = [];
  for (let i = 0; i < friendIds.length; i++) {
    //loop through friend to get uids
    let tmpval = await userController.getUserById(friendIds[i]);
    let tmpFriends = tmpval?.friends || [];
    let mutual = tmpFriends.some(
      (id) => id._id.toString() === user._id.toString()
    );
    //console.log("Checking mutual value", mutual);
    if (mutual === true) {
      finalArray.push(tmpval.uid.toString());
      //console.log("friend", i, friendIds[i]);
    }
  }
  return finalArray;
}
async function searchPosts(queryText, user) {
  queryText = validation.validateString(queryText, "Search Query");
  if (!queryText || queryText.length < 2) {
    throw new Error("Search query must be at least 2 characters long.");
  }
  let friendIds = (user?.friends || []).map((id) => id._id.toString());
  let finalArray = [];
  for (let i = 0; i < friendIds.length; i++) {
    //loop through friend to get uids
    let tmpval = await userController.getUserById(friendIds[i]);
    let tmpFriends = tmpval?.friends || [];
    let mutual = tmpFriends.some(
      (id) => id._id.toString() === user._id.toString()
    );
    //console.log("Checking mutual value", mutual);
    if (mutual === true) {
      finalArray.push(tmpval.uid.toString());
      console.log("friend", i, friendIds[i]);
    }
  }
  let currentUserId;
  const shouldClauses = [
    { term: { isPrivate: false } }, // Always include public posts
  ];
  if (user) {
    currentUserId = user.uid.toString();
    shouldClauses.push({ term: { uid: currentUserId } });
    if (finalArray.length > 0) {
      shouldClauses.push({ terms: { uid: finalArray } });
    }
  }
  //console.log("Checking friendsIds", friendIds);
  //console.log("Checking UserId", currentUserId);

  let { body } = await elasticClient.search({
    index: "posts",
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: queryText.toLowerCase(),
                fuzziness: "AUTO",
                operator: "or",
                minimum_should_match: "60%",
                fields: ["text", "senderUsername"],
              },
            },
          ],
          filter: {
            bool: {
              should: shouldClauses,
              minimum_should_match: 1,
            },
          },
        },
      },
    },
  });

  //console.log("Raw Elasticsearch Response:", JSON.stringify(body, null, 2));
  //console.log("Values we mentioned", body);
  //console.log("hits", body.hits);
  //console.log("length", body.hits.hits.length);
  if (body && body.hits && body.hits.hits.length > 0) {
    //console.log("Search Results:", body.hits.hits);
    let results = body.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));
    //console.log("Mapped Search Results:", results);
    for (let i = 0; i < results.length; i++) {
      const curPost = results[i];
      //console.log("update sender: ", curPost);
      const post = await getPostById(curPost.id);
      //console.log("updated post:", post);
      results[i] = post;
    }
    return results;
  } else {
    console.log("I should not be here");
    console.log("No results found");
    return [];
  }
}
//   async function deletePostFromElastic(postId) {
//     try {
//       const response = await elasticClient.delete({
//         index: 'posts', // The index name you're using
//         id: postId, // The ID of the document you want to delete
//       });

//       console.log("Document deleted from Elasticsearch:", response);
//     } catch (error) {
//       console.error("Error deleting document from Elasticsearch:", error);
//     }
//   }
//   async function searchPostAndDelete(queryText) {
//     try {
//       const body = await elasticClient.search({
//         index: 'posts', // The index name you're using
//         body: {
//           query: {
//             match: {
//               text: queryText // The search term to find the document
//             }
//           }
//         }
//       });

//       // If results are found, delete the document
//       if (body.hits.hits.length > 0) {
//         const postId = body.hits.hits[0]._id; // Get the ID of the first matching document
//         console.log(`Found document ID: ${postId}`);
//         await deletePostFromElastic(postId); // Delete the document
//       } else {
//         console.log('No matching posts found in Elasticsearch');
//       }
//     } catch (error) {
//       console.error('Error during Elasticsearch search:', error);
//     }
//   }

//   // Example usage: Search for the document by a part of the text (e.g., "fun")
//   searchPostAndDelete("Testing I like wario"); // Adjust the search query as necessary
// async function testConnection() {
//     try {
//       const response = await elasticClient.ping();
//       console.log('Connected to Elasticsearch:', response);
//     } catch (error) {
//       console.error('Error connecting to Elasticsearch:', error);
//     }
//   }

//   testConnection();
async function getPostsByUid(userUid) {
  let user = await userController.getUserByUID(userUid);
  if (!user) {
    throw `No user with uid (${userUid})`;
  }
  console.log("user: " + user);
  const posts = await Post.find({ sender: user._id });
  console.log("Posts: ", posts);
  if (!posts) {
    throw `No post with id (${posts})!`;
  }
  return posts;
}
createIndex().catch((err) => {
  console.error("❌ Error ensuring Elasticsearch index exists:", err);
});
export default {
  getNPosts,
  postPost,
  canDeletePost,
  deletePost,
  editPost,
  likePost,
  reportPost,
  getPostById,
  canSeePost,
  searchPosts,
  getPostsByUid,
  findMutualFriend,
  getModPosts,
};
