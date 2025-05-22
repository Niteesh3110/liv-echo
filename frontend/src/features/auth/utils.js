import { get, post } from "../../utils/requests/axios.js";
import firebaseUtils from "../../firebase/utils.js";
import {
  getAuth,
  updateProfile,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import validation from "../../utils/validation.js";

async function userInfoModeration(text, attachments) {
  try {
    const response = await post("moderation", {
      text,
      attachments,
    });

    if (response.data) {
      return response.data;
    } else {
      throw "No Response!";
    }
  } catch (e) {
    console.error(e);
    throw `Message Moderation Failed`;
  }
}

async function signUpUser(name, email, username, dob, password) {
  try {
    validation.validateString(name);
    validation.validateString(email);
    validation.validateUsername(username);
    validation.validateDob(dob);
    validation.validatePassword(password);
  } catch (e) {
    console.log(e);
    throw "Fix errors before submitting!";
  }

  if (name.length > 500) {
    throw `Name length cannot exceed 500!`;
  }

  // try {
  //   const moderationResponse = await userInfoModeration(name, []);
  //   if (moderationResponse.flagged) {
  //     const moderationErr = new Error("Moderation Error");
  //     moderationErr.type = "moderation";
  //     moderationErr.message = "Name not allowed";
  //     throw moderationErr;
  //   }
  // } catch (err) {
  //   console.error("Name not allowed Error");
  //   throw err;
  // }

  // try {
  //   const moderationResponse = await userInfoModeration(username, []);
  //   if (moderationResponse.flagged) {
  //     const moderationErr = new Error("Moderation Error");
  //     moderationErr.type = "moderation";
  //     moderationErr.message = "Username not allowed";
  //     throw moderationErr;
  //   }
  // } catch (err) {
  //   console.error("Username not allowed Error");
  //   throw err;
  // }

  try {
    await get("users/signup/uniqueCheck/", {
      email: email,
      username: username,
    });
  } catch (e) {
    console.log(e);

    throw e.data && e.data.message
      ? e.data.message
      : "Email and Username are already taken!";
  }

  try {
    const user = await firebaseUtils.createFirebaseUser(email, password, name);
  } catch (e) {
    console.log(e);
    throw e.message;
  }

  try {
    const auth = getAuth();
    let user = auth.currentUser;
    let serverUser = (
      await post("users/signup/", { uid: user.uid, name, email, username, dob })
    ).data.data;
    console.log("signed up user", serverUser);
    await sendEmailVerification(user);
    alert("Verify your email before logging in!");
    await firebaseUtils.signOutFirebaseUser();

    return { ...user, ...serverUser };
  } catch (e) {
    // await firebaseUtils.deleteFirebaseUser();
    try {
      await firebaseUtils.signOutFirebaseUser();
    } catch (e) {}
    console.log(e);
    throw e.data && e.data.message
      ? e.data.message
      : "Sign in failed! Try again.";
  }
}

async function signInUser(username, email, password) {
  try {
    validation.validateEmail(email);
    validation.validatePassword(password);
  } catch (e) {
    console.log(e);
    throw "Fix errors before submitting!";
  }

  try {
    const user = await firebaseUtils.signInFirebaseUser(email, password);
  } catch (e) {
    console.log(e);
    throw e.message;
  }

  try {
    const auth = getAuth();
    const user = auth.currentUser;
    await post("users/signin/", { uid: user.uid, email });
  } catch (e) {
    console.log(e);
    throw e.data && e.data.message
      ? e.data.message
      : "Sign in failed! Try again.";
  }
}
async function editUser(name, email, username, dob, password, oldPassword) {
  try {
    validation.validateString(name);
    validation.validateEmail(email);
    validation.validateUsername(username);
    validation.validateDob(dob);
    if (password) validation.validatePassword(password);
    if (oldPassword) validation.validatePassword(oldPassword);
  } catch (e) {
    console.log(e);
    throw "Fix errors before submitting!";
  }

  if (name.length > 500) {
    throw `Name length cannot exceed 500!`;
  }

  try {
    const moderationResponse = await userInfoModeration(name, []);
    if (moderationResponse.flagged) {
      const moderationErr = new Error("Moderation Error");
      moderationErr.type = "moderation";
      moderationErr.message = "Name not allowed";
      throw moderationErr;
    }
  } catch (err) {
    console.error("Name not allowed Error");
    throw err;
  }

  try {
    const moderationResponse = await userInfoModeration(username, []);
    if (moderationResponse.flagged) {
      const moderationErr = new Error("Moderation Error");
      moderationErr.type = "moderation";
      moderationErr.message = "Username not allowed";
      throw moderationErr;
    }
  } catch (err) {
    console.error("Username not allowed Error");
    throw err;
  }

  try {
    let auth = getAuth();
    console.log("Auth: ", auth);
    const user = auth.currentUser;
    let bool = false;
    if (!user) {
      throw new Error("No user is currently logged in!");
    }
    const uid = user.uid;
    if (oldPassword) {
      await firebaseUtils.reauthenticateFirebaseUser(oldPassword);
    }
    if (username) {
      await get("users/editaccount/username/uniqueCheck/", {
        //check username not used
        username: username,
        uid: uid,
      });
    }
    if (email !== user.email) {
      console.log("EMAIL PLS");
      if (!user.emailVerified) {
        // User's email is not verified, so send verification email and stop
        await sendEmailVerification(user);
        throw new Error(
          "Please verify your current email address before changing it. We've sent you a verification email."
        );
      }
      if (!oldPassword) {
        throw new Error(
          "You must enter your current password to update your email."
        );
      }
      await get("users/editaccount/email/uniqueCheck/", {
        //check email not used
        email: email,
        uid: uid,
      });
      try {
        await firebaseUtils.reauthenticateFirebaseUser(oldPassword);
      } catch (err) {
        console.log("Reauthentication failed", err);
        throw new Error(
          "Reauthentication failed. Please make sure your current password is correct."
        );
      }
      try {
        const response = await post("users/editaccount/email/update", {
          uid: uid,
          newEmail: email,
        });
        console.log(response.data.message); // Email updated successfully
      } catch (err) {
        console.log("Failed to update email in backend:", err);
        throw new Error("Failed to update email in backend.");
      }
    }
    await post("users/editAccount/", {
      uid: user.uid,
      name: name || user.displayName,
      email: email || user.email,
      username: username,
      dob: dob,
    });
    await updateProfile(user, {
      displayName: name,
    });
    if (password) {
      console.log("Password pls");
      await updatePassword(user, password);
    }

    auth = getAuth();
    console.log("Updated auth: ", auth);
    const curUser = auth.currentUser;
    if (email !== user.email) {
      await firebaseUtils.signOutFirebaseUser();
    }
    return {
      emailPendingVerification: false, // Since Admin SDK handles the verification automatically
      message: "Account updated successfully.",
    };
  } catch (e) {
    console.log(e);
    throw e.data && e.data.message
      ? e.data.message
      : "Failed to update Account! Try Again";
  }
}
export default {
  signUpUser,
  signInUser,
  editUser,
};
