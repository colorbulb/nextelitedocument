import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // The users collection uses email-based document IDs, not UID
          // Query by email or by uid field
          const usersRef = collection(db, 'users');
          
          // Try to find user by email first (since doc IDs are email-based)
          const emailQuery = query(usersRef, where('email', '==', user.email));
          const emailSnapshot = await getDocs(emailQuery);
          
          let userDoc = null;
          let userData = null;
          
          if (!emailSnapshot.empty) {
            // Found by email
            userDoc = emailSnapshot.docs[0];
            userData = userDoc.data();
          } else {
            // Try to find by uid field
            const uidQuery = query(usersRef, where('uid', '==', user.uid));
            const uidSnapshot = await getDocs(uidQuery);
            
            if (!uidSnapshot.empty) {
              userDoc = uidSnapshot.docs[0];
              userData = userDoc.data();
            }
          }
          
          if (userData) {
            // Check for role field
            const role = userData.role || userData.userRole || userData.user_type || 'student';
            setUserRole(role);
            
            // Only allow teachers to access
            if (role === 'teacher' || role === 'admin' || role === 'Teacher' || role === 'Admin') {
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: userData.displayName || userData.name || userData.username || user.email?.split('@')[0] || 'Admin',
                role: role
              });
            } else {
              setCurrentUser(null);
              alert('Access denied. Only teachers can access this portal.');
              await signOut(auth);
            }
          } else {
            // User document doesn't exist in users collection
            setCurrentUser(null);
            alert('User not found in system. Please contact administrator to set up your account.');
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setCurrentUser(null);
          alert('Error checking user permissions: ' + error.message);
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        alert('Invalid email or password. Please check your credentials.');
      } else {
        alert('Login failed: ' + error.message);
      }
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-neutral">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary mx-auto mb-4"></div>
          <p className="text-brand-primary text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AdminDashboard 
      currentUser={currentUser}
      onLogout={() => signOut(auth)}
    />
  );
}

export default App;

