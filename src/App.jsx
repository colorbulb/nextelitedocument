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
          console.log('🔍 App: User authenticated, checking teacher collection for email:', user.email);
          
          // Check teachers collection - match by email after authentication
          const teachersRef = collection(db, 'teachers');
          console.log('📋 App: Querying teachers collection...');
          
          // Find teacher by email (must match authenticated user's email)
          const emailQuery = query(teachersRef, where('email', '==', user.email));
          const emailSnapshot = await getDocs(emailQuery);
          
          console.log('📋 App: Teacher query result - found:', emailSnapshot.docs.length, 'documents');
          
          let teacherDoc = null;
          let teacherData = null;
          let matchType = null;
          
          if (!emailSnapshot.empty) {
            // Teacher found by email
            teacherDoc = emailSnapshot.docs[0];
            teacherData = teacherDoc.data();
            matchType = 'email';
            console.log('✅ App: Teacher found by email:', {
              docId: teacherDoc.id,
              email: teacherData.email,
              name: teacherData.name || teacherData.displayName,
              uid: teacherData.uid
            });
          } else {
            // Try to find by uid (like NextElite does)
            console.log('📋 App: Teacher not found by email, trying UID:', user.uid);
            const uidQuery = query(teachersRef, where('uid', '==', user.uid));
            const uidSnapshot = await getDocs(uidQuery);
            
            console.log('📋 App: UID query result - found:', uidSnapshot.docs.length, 'documents');
            
            if (!uidSnapshot.empty) {
              teacherDoc = uidSnapshot.docs[0];
              teacherData = teacherDoc.data();
              matchType = 'uid';
              console.log('✅ App: Teacher found by UID:', {
                docId: teacherDoc.id,
                email: teacherData.email,
                name: teacherData.name || teacherData.displayName,
                uid: teacherData.uid
              });
            }
          }
          
          if (teacherData) {
            // Teacher found - grant access
            console.log('✅ App: Full teacher data:', teacherData);
            console.log('✅ App: Teacher found (matched by ' + matchType + '), granting access and permissions');
            setUserRole('teacher');
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: teacherData.name || teacherData.displayName || teacherData.username || user.email?.split('@')[0] || 'Teacher',
              role: 'teacher'
            });
          } else {
            // Teacher not found in teachers collection - not authorized
            console.log('❌ App: Teacher not found in teachers collection');
            console.log('❌ App: Email searched:', user.email);
            console.log('❌ App: UID searched:', user.uid);
            console.log('❌ App: User is not authorized - not a teacher');
            setCurrentUser(null);
            // Sign out and show error (error will be handled by Login component)
            await signOut(auth);
            // Set error state that Login component can read
            sessionStorage.setItem('loginError', 'Not authorized. Only teachers can access this portal.');
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
