  const passport = require('passport');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const FacebookStrategy = require('passport-facebook').Strategy;
  const User = require('../models/User');

  // -------------------- GOOGLE STRATEGY --------------------
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = new User({
              googleId: profile.id,
              username: profile.displayName,
              email: profile.emails[0].value,
              profilePicture: profile.photos[0].value,
            });
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  // -------------------- FACEBOOK STRATEGY --------------------
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FB_APP_ID,
        clientSecret: process.env.FB_APP_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });

          if (!user) {
            user = new User({
              facebookId: profile.id,
              username: profile.displayName,
              email: profile.emails?.[0]?.value || '',
              profilePicture: profile.photos?.[0]?.value || '',
            });
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  // -------------------- SERIALIZE / DESERIALIZE --------------------
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
  module.exports = passport;