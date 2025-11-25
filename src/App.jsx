import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { Container, Spinner } from 'reactstrap';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    console.log('🔐 App: Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 App: Auth state changed, user:', user ? { uid: user.uid, email: user.email } : 'null');
      
      if (user) {
        try {
          console.log('🔍 App: Checking teacher collection for user:', user.email);
          
          // Check users collection for teacher role
          const usersRef = collection(db, 'users');
          console.log('📋 App: Querying users collection...');
          
          // Try to find user by email first
          const emailQuery = query(usersRef, where('email', '==', user.email));
          const emailSnapshot = await getDocs(emailQuery);
          
          console.log('📋 App: Email query result - found:', emailSnapshot.docs.length, 'documents');
          
          let userDoc = null;
          let userData = null;
          
          if (!emailSnapshot.empty) {
            userDoc = emailSnapshot.docs[0];
            userData = userDoc.data();
            console.log('✅ App: Found user by email:', {
              docId: userDoc.id,
              email: userData.email,
              role: userData.role,
              uid: userData.uid
            });
          } else {
            // Try to find by uid field
            console.log('📋 App: Trying to find user by UID:', user.uid);
            const uidQuery = query(usersRef, where('uid', '==', user.uid));
            const uidSnapshot = await getDocs(uidQuery);
            
            console.log('📋 App: UID query result - found:', uidSnapshot.docs.length, 'documents');
            
            if (!uidSnapshot.empty) {
              userDoc = uidSnapshot.docs[0];
              userData = uidSnapshot.docs[0].data();
              console.log('✅ App: Found user by UID:', {
                docId: userDoc.id,
                email: userData.email,
                role: userData.role,
                uid: userData.uid
              });
            }
          }
          
          if (userData) {
            // Check for role field
            const role = (userData.role || userData.userRole || userData.user_type || 'student').toLowerCase();
            console.log('👤 App: User role detected:', role);
            console.log('👤 App: Full user data:', userData);
            
            setUserRole(role);
            
            // Only allow teachers to access
            if (role === 'teacher' || role === 'admin') {
              console.log('✅ App: User is teacher/admin, granting access');
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: userData.displayName || userData.name || userData.username || user.email?.split('@')[0] || 'Admin',
                role: role
              });
            } else {
              console.log('❌ App: User is not a teacher/admin, denying access. Role:', role);
              setCurrentUser(null);
              alert('Access denied. Only teachers can access this portal.');
              await signOut(auth);
            }
          } else {
            console.log('❌ App: User document not found in users collection');
            setCurrentUser(null);
            alert('User not found in system. Please contact administrator to set up your account.');
            await signOut(auth);
          }
        } catch (error) {
          console.error('❌ App: Error checking user role:', error);
          console.error('❌ App: Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          setCurrentUser(null);
          alert('Error checking user permissions: ' + error.message);
          await signOut(auth);
        }
      } else {
        console.log('🔐 App: No user authenticated');
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-brand-neutral">
        <div className="text-center">
          <Spinner color="primary" style={{ width: '3rem', height: '3rem', borderWidth: '0.3rem' }} className="mb-3" />
          <p className="text-brand-primary text-lg fw-medium">Loading...</p>
        </div>
      </Container>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <AdminDashboard 
      currentUser={currentUser}
      onLogout={() => signOut(auth)}
    />
  );
}

export default App;
