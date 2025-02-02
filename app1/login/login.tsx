'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token); // Store the token
      router.push('/'); // Redirect to home page
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Handle Axios-specific errors
        alert(err.response?.data?.error || 'Login failed');
      } else if (err instanceof Error) {
        // Handle generic errors
        alert(err.message);
      } else {
        // Handle unknown errors
        alert('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
      <p className="mt-4">
        Don't have an account?{' '}
        <a href="/register" className="text-blue-500">
          Register here
        </a>
      </p>
    </div>
  );
}