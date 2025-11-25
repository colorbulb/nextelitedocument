import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import logo from '/logo.png';
import { Container, Card, CardBody, Form, FormGroup, Input, Button, Alert } from 'reactstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('🔐 Login: Attempting to sign in with email:', email);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login: Sign in successful');
      // Auth state change will be handled by App.jsx
    } catch (error) {
      console.error('❌ Login: Sign in error:', error);
      console.error('❌ Login: Error code:', error.code);
      console.error('❌ Login: Error message:', error.message);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError('Login failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-neutral d-flex align-items-center justify-content-center p-4">
      <Container className="w-100" style={{ maxWidth: '450px' }}>
        <Card className="shadow-lg border-0">
          <CardBody className="p-5">
            <div className="text-center mb-5">
              <div className="rounded-circle bg-brand-primary d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                <img src={logo} width="100px" alt="Logo" />
              </div>
              <h1 className="text-3xl fw-bold" style={{ color: '#7D633C' }}>
                NextDoc
              </h1>
              <p className="mt-2 fw-medium" style={{ color: '#0F2E42' }}>Document Management System</p>
            </div>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="mb-3"
                  required
                  disabled={loading}
                  style={{ 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                />
              </FormGroup>
              
              <FormGroup>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mb-3"
                  required
                  disabled={loading}
                  style={{ 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                />
              </FormGroup>
              
              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <Button
                type="submit"
                className="w-100 py-3 fw-semibold"
                disabled={loading}
                style={{ 
                  backgroundColor: '#FF6B6B',
                  border: 'none',
                  borderRadius: '8px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default Login;

