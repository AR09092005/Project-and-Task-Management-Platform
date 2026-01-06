const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const User = require('../models/User');

// JWT Strategy for API authentication
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.jwt;
  }
  return token;
};

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-passwordHash');
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Update OAuth info if needed
            if (!user.oauthProviders.includes('google')) {
              user.oauthProviders.push('google');
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0]?.value,
            emailVerified: true,
            oauthProviders: ['google'],
            role: 'Team Member',
          });

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0]?.value;
          if (!email) {
            return done(new Error('No email found in GitHub profile'), false);
          }

          let user = await User.findOne({ email });

          if (user) {
            if (!user.oauthProviders.includes('github')) {
              user.oauthProviders.push('github');
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName || profile.username,
            email,
            profilePicture: profile.photos[0]?.value,
            emailVerified: true,
            oauthProviders: ['github'],
            role: 'Team Member',
          });

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL,
        scope: ['user.read'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0]?.value;
          if (!email) {
            return done(new Error('No email found in Microsoft profile'), false);
          }

          let user = await User.findOne({ email });

          if (user) {
            if (!user.oauthProviders.includes('microsoft')) {
              user.oauthProviders.push('microsoft');
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName,
            email,
            profilePicture: profile.photos[0]?.value,
            emailVerified: true,
            oauthProviders: ['microsoft'],
            role: 'Team Member',
          });

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

module.exports = passport;
