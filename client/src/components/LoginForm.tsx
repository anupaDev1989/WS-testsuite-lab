import React, { useState } from 'react';
import { signIn, signUp, requestPasswordReset } from '../lib/auth';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isPasswordResetMode) {
        await requestPasswordReset(email);
        setError('If an account with this email exists, a password reset link has been sent.');
        setIsPasswordResetMode(false);
      } else if (isSignUpMode) {
        await signUp(email, password);
        alert('Sign up successful! Please log in.'); 
        setIsSignUpMode(false); 
      } else {
        const user = await signIn(email, password);
        console.log('Logged in user:', user);
        localStorage.setItem('isLoggedIn', 'true'); 
        onLoginSuccess();
      }
    } catch (error: any) { 
      console.error('Login/SignUp Error:', error, 'Message:', error.message);
      if (error.message === 'USER_ALREADY_REGISTERED') {
        setError('Email Already Registered..!');
      } else if (error.message && error.message.includes('User already registered')) { 
        setError('Email Already Registered..!');
      } else {
        setError(isSignUpMode ? 'Sign up failed. Please try again.' : 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px] bg-[#1C2333] border-[#2D3343]">
      <CardHeader>
        <CardTitle className="text-xl text-white">
          {isPasswordResetMode ? 'Reset Password' : (isSignUpMode ? 'Sign Up' : 'Login')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-[#131A29] border-[#2D3343] text-white"
              required
            />
          </div>
          {!isPasswordResetMode && (
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-[#131A29] border-[#2D3343] text-white"
                required
              />
            </div>
          )}
          {error && <p className={`text-sm ${error.startsWith('If an account') ? 'text-green-500' : 'text-red-500'}`}>{error}</p>}
          <Button 
            type="submit" 
            className="w-full bg-[#0098FF] hover:bg-[#0080DC]"
            disabled={isLoading}
          >
            {isLoading 
              ? (isPasswordResetMode ? 'Sending link...' : (isSignUpMode ? 'Signing up...' : 'Logging in...')) 
              : (isPasswordResetMode ? 'Send Reset Link' : (isSignUpMode ? 'Sign Up' : 'Login'))}
          </Button>
          {!isPasswordResetMode && (
            <Button 
              type="button"
              variant="link"
              className="w-full text-sm text-gray-400 hover:text-white"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setError(''); 
              }}
            >
              {isSignUpMode ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </Button>
          )}
          <Button 
            type="button"
            variant="link"
            className="w-full text-sm text-gray-400 hover:text-white"
            onClick={() => {
              setIsPasswordResetMode(!isPasswordResetMode);
              setIsSignUpMode(false); 
              setError(''); 
            }}
          >
            {isPasswordResetMode ? 'Back to Login' : 'Forgot Password?'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
