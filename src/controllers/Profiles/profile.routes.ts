import express from "express";
import ProfileModels from "./modules/profile.model";
import AuthPermission from "../../middlewares/permission.middleware";

const profileRouter = express.Router();

const AUTH_USER_PERMISSION = new AuthPermission();
const PROFILE_INSTANCE = new ProfileModels();

profileRouter.post('/profileinfo', AUTH_USER_PERMISSION.permission('viewprofile','profileinfo'), PROFILE_INSTANCE.profileInfo)

profileRouter.post('/addusers', AUTH_USER_PERMISSION.permission('viewprofile','addusers'), PROFILE_INSTANCE.addusers)

profileRouter.post('/editpassword', AUTH_USER_PERMISSION.permission('viewprofile','editpassword'), PROFILE_INSTANCE.editpassword)

export default profileRouter;