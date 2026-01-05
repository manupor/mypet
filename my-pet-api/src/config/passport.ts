import { PassportStatic } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/init';

export function configurePassport(passport: PassportStatic) {
  // Local Strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
        
        if (!user) {
          return done(null, false, { message: 'Usuario no encontrado' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Usa el login social para esta cuenta' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = db.prepare(
          'SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?'
        ).get('google', profile.id) as any;

        if (!user) {
          // Check if email exists
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
            if (user) {
              // Link Google to existing account
              db.prepare(
                'UPDATE users SET auth_provider = ?, auth_provider_id = ?, avatar = ? WHERE id = ?'
              ).run('google', profile.id, profile.photos?.[0]?.value, user.id);
              return done(null, user);
            }
          }

          // Create new user
          const id = uuidv4();
          db.prepare(`
            INSERT INTO users (id, email, name, avatar, auth_provider, auth_provider_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            id,
            email || `${profile.id}@google.user`,
            profile.displayName,
            profile.photos?.[0]?.value,
            'google',
            profile.id
          );
          
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Facebook Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = db.prepare(
          'SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?'
        ).get('facebook', profile.id) as any;

        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
            if (user) {
              db.prepare(
                'UPDATE users SET auth_provider = ?, auth_provider_id = ?, avatar = ? WHERE id = ?'
              ).run('facebook', profile.id, profile.photos?.[0]?.value, user.id);
              return done(null, user);
            }
          }

          const id = uuidv4();
          db.prepare(`
            INSERT INTO users (id, email, name, avatar, auth_provider, auth_provider_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            id,
            email || `${profile.id}@facebook.user`,
            profile.displayName,
            profile.photos?.[0]?.value,
            'facebook',
            profile.id
          );
          
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user);
  });
}
