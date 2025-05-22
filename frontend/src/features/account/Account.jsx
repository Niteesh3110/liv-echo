import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  Card,
  Box,
  CardHeader,
  Paper,
  IconButton,
  Dialog,
  Typography,
  useTheme,
  CardContent,
  Tabs,
  Tab,
  Grid,
  CardActionArea,
  Stack,
  Button,
} from "@mui/material";
import defaultBanner from "../../assets/landing/landing1.jpg";
import PaginatedList from "../../components/PaginatedList.jsx";
import UserCard from "../users/UserCard.jsx";
import Profile from "../../components/Profile";
import EditIcon from "@mui/icons-material/Edit";
import EditAccount from "./EditAccount";
import EditBanner from "./EditBanner";
import EditProfile from "./EditProfile";
import EditButton from "../../components/EditButton";
import dayjs from "dayjs";
import EditBio from "./EditBio";
import postUtils from "../posts/postUtils.js";
import PostCard from "../posts/PostCard.jsx";
import userUtils from "../users/userUtils.js";
import DeletePostDialog from "../posts/DeletePostDialog";
import EditPostDialog from "../posts/EditPostDialog";
import { Link, useNavigate } from "react-router-dom";
import StaticPaginatedList from "../../components/StaticPaginatedList.jsx";
import FriendCard from "./FriendCard.jsx";
import CustomList from "../../components/CustomList.jsx";
import chatSocket from "../../sockets/namespaces/chatSocket.js";
import { useNotification } from "../../contexts/NotificationContext.jsx";
import Loading from "../../components/Loading.jsx";
export default function Account() {
  const { user, refreshAccount } = useContext(AuthContext);
  const theme = useTheme();
  const [openEditAccount, setOpenEditAccount] = useState(false);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openEditBanner, setOpenEditBanner] = useState(false);
  const [openEditBio, setOpenEditBio] = useState(false);
  const [deletePost, setDeletePost] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [modPosts, setModPosts] = useState([]);
  const { notificatons } = useNotification();

  const handleTabChange = (_, newValue) => {
    setTab(newValue);
    refreshAccount();
  };
  function getFriends() {
    // console.log(user.friends);
    return user.friends;
  }
  async function handleDeleteSuccess() {
    const postList = await postUtils.getPostsByUID(user.uid);
    setPosts(postList);
  }
  async function handleEditSuccess() {
    const postList = await postUtils.getPostsByUID(user.uid);
    setPosts(postList);
    setEditPost(null);
  }
  // console.log("Cur user: ", user);
  function closeModals() {
    setOpenEditAccount(false);
    setOpenEditBanner(false);
    setOpenEditProfile(false);
    setOpenEditBio(false);
  }

  useEffect(() => {
    async function getUserData() {
      const response = await userUtils.fetchUserByUID(user.uid);
      setUserData(response);
    }
    getUserData();
  }, [user.uid]);

  useEffect(() => {
    async function getPosts() {
      const postList = await postUtils.getPostsByUID(user.uid);
      setPosts(postList);
    }
    refreshAccount();
    getPosts();
  }, [user.uid, notificatons]);

  if (user.role === "admin") {
    useEffect(() => {
      async function getModPosts() {
        const modPostList = await postUtils.getModPosts();
        // console.log("mod posts: " + modPostList);
        setModPosts(modPostList);
      }
      getModPosts();
    }, [notificatons]);
  }
  // console.log("posts: ", posts);
  if (!user.name || !user.username) {
    return <Loading />;
  }
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 4rem)",
        width: "100vw",
      }}
    >
      <Box
        sx={{
          height: "35vh",
          minHeight: "35vh",
          width: "100vw",
          width: "100%",
          backgroundImage: `url(${user.banner?.secure_url || defaultBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <IconButton
          onClick={() => setOpenEditBanner(true)}
          sx={{
            position: "absolute",
            top: 1,
            right: 1,
            marginRight: "1em",
            marginTop: "1em",
            backgroundColor: "rgba(255,255,255,0.5)",
            "&:hover": { backgroundColor: "rgba(200,255,200,1)" },
          }}
        >
          <EditIcon fontSize="medium" />
        </IconButton>

        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: -60,
            display: "flex",
          }}
        >
          <Profile
            sx={{
              width: "20vh",
              height: "20vh",
              fontSize: "4vh",
              boxShadow: "1px 1px 10px 1px black",
            }}
            user={user}
          />
          <IconButton
            onClick={() => setOpenEditProfile(true)}
            sx={{
              position: "absolute",
              bottom: 1,
              right: 1,
              marginRight: "1.5em",
              marginBottom: "1.5em",
              backgroundColor: "rgba(255,255,255,0.5)",
              "&:hover": { backgroundColor: "rgba(200,255,200,1)" },
            }}
          >
            <EditIcon fontSize={"small"} />
          </IconButton>
        </Box>
      </Box>
      <Paper
        sx={{
          backgroundColor: theme.palette.background.default,
          flex: 1,
          padding: "4rem",
          justifyContent: "center",
        }}
      >
        <Tabs value={tab} onChange={handleTabChange} centered sx={{ mt: 10 }}>
          <Tab label="About" />
          <Tab label="Friends" />

          <Tab label="Posts" />
          <Tab label="Friend Requests" />

          {user.role == "admin" && <Tab label="Moderation" />}
        </Tabs>
        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography
              variant="h3"
              textAlign="center"
              mx={"2rem"}
            >{`Welcome, ${user.name}!`}</Typography>

            <Card
              sx={{
                marginTop: "2rem",
                mx: "auto",
                width: "60%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <CardHeader title="Bio" />
                <EditButton onClick={() => setOpenEditBio(true)} />
              </Box>
              <CardContent>{user.bio || "Edit to add bio!"}</CardContent>
            </Card>
            <Card
              sx={{
                marginTop: "2rem",
                mx: "auto",
                width: "60%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <CardHeader title="Account Info" />

                <EditButton
                  onClick={() => setOpenEditAccount(!openEditAccount)}
                />
              </Box>
              <CardContent>Name: {user.name}</CardContent>

              <CardContent>Username: {user.username}</CardContent>
              <CardContent>Email: {user.email}</CardContent>
              <CardContent>
                Date of Birth:{" "}
                {dayjs(user.dob?.substring(0, 10)).format("MM/DD/YYYY")}
              </CardContent>
              <CardContent>Password: ****************</CardContent>
            </Card>
          </Box>
        )}

        {tab === 1 && user?.friends?.length > 0 && (
          <Box sx={{ p: 2 }}>
            <StaticPaginatedList
              title={"Friends"}
              type={"friends"}
              sourceData={user?.friends}
              ListItemComponent={FriendCard}
              enableSearch={false}
              PAGE_SIZE={10}
            />
          </Box>
        )}
        {tab === 1 && user?.friends?.length === 0 && (
          <Typography variant="h3" textAlign="center" mx={"2rem"}>
            Sorry You Have No Friends
          </Typography>
        )}
        {tab === 2 && posts?.length > 0 && (
          <Grid
            container
            spacing={3}
            justifyContent="center"
            direction={"column"}
          >
            {posts.map((post) => (
              <Box key={post._id} sx={{ mb: 2 }}>
                <Paper
                  elevation={3}
                  sx={{ maxWidth: "800px", mx: "auto", p: 1 }}
                >
                  <Card elevation={1}>
                    <CardActionArea component={Link} to={`/posts/${post._id}`}>
                      <CardHeader
                        title={post.senderUsername}
                        subheader={post.senderName}
                      />
                      <CardContent>
                        <Typography variant="body1" gutterBottom>
                          {post.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Posted on {new Date(post.createdAt).toLocaleString()}
                        </Typography>
                        {post.attachments && post.attachments?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1">
                              Attachments:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                                mt: 1,
                              }}
                            >
                              {post.attachments.map((attachment) =>
                                attachment.resource_type === "image" ? (
                                  <Box
                                    key={attachment._id}
                                    sx={{ maxWidth: "100%" }}
                                  >
                                    <img
                                      src={attachment.secure_url}
                                      alt="attachment"
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: "400px",
                                        borderRadius: "8px",
                                      }}
                                    />
                                  </Box>
                                ) : null
                              )}
                            </Box>
                          </Box>
                        )}
                        {post.isPrivate && (
                          <Typography variant="caption" color="warning.main">
                            Private Post
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setEditPost(post)}
                    >
                      Edit Post
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeletePost(post._id)}
                    >
                      Delete Post
                    </Button>
                    {deletePost === post._id && (
                      <DeletePostDialog
                        open={true}
                        handleClose={() => setDeletePost(null)}
                        postId={deletePost}
                        onDeleteSuccess={handleDeleteSuccess}
                      />
                    )}
                    {editPost && (
                      <EditPostDialog
                        open={editPost}
                        handleClose={() => setEditPost(null)}
                        post={post}
                        onEditSuccess={handleEditSuccess}
                      />
                    )}
                  </Stack>
                </Paper>
              </Box>
            ))}
          </Grid>
        )}
        {tab === 2 && posts?.length === 0 && (
          <Typography variant="h3" textAlign="center" mx={"2rem"}>
            Sorry You Have No Posts
          </Typography>
        )}

        {tab === 3 && user?.friendRequests?.length > 0 && (
          <Box sx={{ p: 2 }}>
            <StaticPaginatedList
              title={"Friend Requests"}
              type={"friendRequests"}
              sourceData={user?.friendRequests}
              ListItemComponent={FriendCard}
              enableSearch={false}
              PAGE_SIZE={10}
            />
          </Box>
        )}
        {tab === 3 && user?.friendRequests?.length === 0 && (
          <Typography variant="h3" textAlign="center" mx={"2rem"}>
            No friend requests avaliable.
          </Typography>
        )}

        {tab === 4 && modPosts?.length > 0 && (
          <Grid
            container
            spacing={3}
            justifyContent="center"
            direction={"column"}
          >
            {modPosts.map((post) => (
              <Box key={post._id} sx={{ mb: 2 }}>
                <Paper
                  elevation={3}
                  sx={{ maxWidth: "800px", mx: "auto", p: 1 }}
                >
                  <Card elevation={1}>
                    <CardActionArea component={Link} to={`/posts/${post._id}`}>
                      <CardHeader
                        title={post.senderUsername}
                        subheader={post.senderName}
                      />
                      <CardContent>
                        <Typography variant="body1" gutterBottom>
                          {post.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Posted on {new Date(post.createdAt).toLocaleString()}
                        </Typography>
                        {post.attachments && post.attachments?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1">
                              Attachments:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                                mt: 1,
                              }}
                            >
                              {post.attachments.map((attachment) =>
                                attachment.resource_type === "image" ? (
                                  <Box
                                    key={attachment._id}
                                    sx={{ maxWidth: "100%" }}
                                  >
                                    <img
                                      src={attachment.secure_url}
                                      alt="attachment"
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: "400px",
                                        borderRadius: "8px",
                                      }}
                                    />
                                  </Box>
                                ) : null
                              )}
                            </Box>
                          </Box>
                        )}
                        {post.isPrivate && (
                          <Typography variant="caption" color="warning.main">
                            Private Post
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setDeletePost(post._id)}
                      >
                        Delete Post
                      </Button>
                      {deletePost === post._id && (
                        <DeletePostDialog
                          open={true}
                          handleClose={() => setDeletePost(null)}
                          postId={deletePost}
                          onDeleteSuccess={handleDeleteSuccess}
                        />
                      )}
                    </Stack>
                  </Card>
                </Paper>
              </Box>
            ))}
          </Grid>
        )}
        {tab === 4 && modPosts?.length === 0 && (
          <Typography variant="h3" textAlign="center" mx={"2rem"}>
            Sorry You Have No Posts To Moderate
          </Typography>
        )}
      </Paper>

      {openEditAccount && (
        <Dialog open={openEditAccount} onClose={closeModals}>
          <Box sx={{ maxHeight: "90vh", overflowY: "auto", p: 2 }}>
            <EditAccount handleClose={closeModals} />
          </Box>
        </Dialog>
      )}

      {openEditBanner && (
        <Dialog open={openEditBanner} onClose={closeModals}>
          {" "}
          <EditBanner handleClose={closeModals} />
        </Dialog>
      )}

      {openEditProfile && (
        <Dialog open={openEditProfile} onClose={closeModals}>
          {" "}
          <EditProfile handleClose={closeModals} />
        </Dialog>
      )}
      {openEditBio && (
        <Dialog open={openEditBio} onClose={closeModals}>
          {" "}
          <EditBio handleClose={closeModals} />
        </Dialog>
      )}
    </Box>
  );
}
