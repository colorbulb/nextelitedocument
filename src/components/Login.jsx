import React, { useState } from 'react';
import logo from '/logo.png';
import { BookOpen } from 'lucide-react';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const success = await onLogin(email, password);
    if (!success) {
      setError('Invalid credentials');
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
            
            <Form>
              <FormGroup>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="mb-3"
                  style={{ 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </FormGroup>
              
              <FormGroup>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mb-3"
                  style={{ 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </FormGroup>
              
              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <Button
                onClick={handleSubmit}
                className="w-100 py-3 fw-semibold"
                style={{ 
                  backgroundColor: '#FF6B6B',
                  border: 'none',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Sign In
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default Login;

