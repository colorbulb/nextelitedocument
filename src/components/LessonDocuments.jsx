import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { storage, db, auth } from '../firebase/config';
import { ArrowLeft, Upload, FileText, X, Download, Trash2, Loader, Lock, Unlock, Eye } from 'lucide-react';
import { Button, Card, CardBody, Modal, ModalHeader, ModalBody, Table, Input } from 'reactstrap';

const LessonDocuments = ({ selectedClass, selectedLevel, selectedLesson, onBack, onReload }) => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showViewLog, setShowViewLog] = useState(false);
  const [selectedDocForLog, setSelectedDocForLog] = useState(null);
  const [viewLogs, setViewLogs] = useState([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedDocForUnlock, setSelectedDocForUnlock] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students for filtering
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]); // NextElite classes for filtering

  useEffect(() => {
    loadDocuments();
    loadStudents();
    loadCourses();
    loadClasses();
  }, [selectedLesson]);

  const loadClasses = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesList = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Loaded classes for filtering:', classesList.length, classesList);
      setClasses(classesList);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  useEffect(() => {
    // Filter students based on search term and class filter
    // This runs whenever allStudents, searchTerm, or selectedClassFilter changes
    if (allStudents && allStudents.length > 0) {
      filterStudents();
    } else if (allStudents && allStudents.length === 0) {
      setStudents([]);
    }
  }, [searchTerm, selectedClassFilter, allStudents]);

  const loadCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Loaded courses:', coursesList.length, coursesList);
      setCourses(coursesList);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const filterStudents = () => {
    if (!allStudents || allStudents.length === 0) {
      setStudents([]);
      return;
    }

    let filtered = [...allStudents];

    // Filter by search term (name or email)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        (student.name || '').toLowerCase().includes(searchLower) ||
        (student.email || '').toLowerCase().includes(searchLower)
      );
    }

    // Filter by enrolled class (using NextElite classes, not courses)
    if (selectedClassFilter) {
      filtered = filtered.filter(student => {
        // Check various possible enrollment fields that NextElite might use
        const enrolledClasses = student.enrolledClasses || student.classes || student.classIds || student.enrolledClassIds || [];
        const classId = student.classId || student.class || student.currentClassId;
        
        console.log('Filtering student:', student.name, {
          enrolledClasses,
          classId,
          selectedClassFilter,
          hasEnrolledClasses: Array.isArray(enrolledClasses) && enrolledClasses.length > 0
        });
        
        // Check if student is enrolled in the selected class
        if (Array.isArray(enrolledClasses) && enrolledClasses.length > 0) {
          // Handle array of class IDs (strings)
          if (enrolledClasses.includes(selectedClassFilter)) {
            console.log('Student matches by array includes:', student.name);
            return true;
          }
          // Handle array of class objects with id property
          if (enrolledClasses.some(c => {
            if (typeof c === 'object' && c !== null) {
              const matches = c.id === selectedClassFilter || c.classId === selectedClassFilter;
              if (matches) console.log('Student matches by object id:', student.name, c);
              return matches;
            }
            const matches = c === selectedClassFilter;
            if (matches) console.log('Student matches by direct value:', student.name, c);
            return matches;
          })) {
            return true;
          }
        }
        
        // Check single classId field
        if (classId === selectedClassFilter) {
          console.log('Student matches by classId field:', student.name);
          return true;
        }
        
        console.log('Student does not match filter:', student.name);
        return false;
      });
      
      console.log('After class filter, students remaining:', filtered.length);
    }

    setStudents(filtered);
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const usersRef = collection(db, 'users');
      
      // Get all users and filter client-side
      // This is more reliable than querying by role (which might need an index)
      const allUsersSnapshot = await getDocs(usersRef);
      console.log('Total users in database:', allUsersSnapshot.docs.length);
      
      const studentsList = allUsersSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid,
            email: data.email,
            name: data.name || data.displayName || data.email?.split('@')[0] || 'Student',
            role: data.role || data.userRole || data.user_type,
            ...data
          };
        })
        .filter(user => {
          // Filter for students ONLY - check role field (case insensitive)
          const role = (user.role || '').toLowerCase();
          const hasIdentifier = user.uid || user.id;
          
          // Only include users with role === 'student' and exclude parents, teachers, admins
          return role === 'student' && hasIdentifier;
        });
      
      console.log('Filtered students:', studentsList.length);
      console.log('Student details:', studentsList.map(s => ({ name: s.name, email: s.email, role: s.role })));
      setAllStudents(studentsList);
      // Don't call filterStudents here - the useEffect will handle it when allStudents changes
    } catch (error) {
      console.error('Error loading students:', error);
      setAllStudents([]);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const lessonRef = doc(
        db,
        'courses',
        selectedClass.id,
        'levels',
        selectedLevel.id,
        'lessons',
        selectedLesson.id
      );
      const lessonDoc = await getDoc(lessonRef);
      
      if (lessonDoc.exists()) {
        const lessonData = lessonDoc.data();
        setDocuments(lessonData.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Failed to load documents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const uploadedDocs = [];

      for (const file of files) {
        // Create storage path
        const storagePath = `courses/${selectedClass.id}/${selectedLevel.id}/${selectedLesson.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        // Upload file
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        uploadedDocs.push({
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: downloadURL,
          path: storagePath,
          uploadedAt: new Date().toISOString(),
          unlockedFor: [], // Array of student IDs/emails who can access - starts empty (locked for all)
          viewLogs: [] // Initialize empty view log
        });
      }

      // Update Firestore
      const lessonRef = doc(
        db,
        'courses',
        selectedClass.id,
        'levels',
        selectedLevel.id,
        'lessons',
        selectedLesson.id
      );
      
      const currentDocs = documents || [];
      await updateDoc(lessonRef, {
        documents: [...currentDocs, ...uploadedDocs]
      });

      setDocuments([...currentDocs, ...uploadedDocs]);
      await onReload();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleOpenUnlockModal = async (docToUnlock) => {
    setSelectedDocForUnlock(docToUnlock);
    // Reset filters when opening modal
    setSearchTerm('');
    setSelectedClassFilter('');
    
    // Reload students, courses, and classes to ensure fresh data
    await Promise.all([loadStudents(), loadCourses(), loadClasses()]);
    
    // Pre-select students who already have access (after loading students)
    // unlockedFor can contain UIDs or email-based IDs, so we need to match both
    const currentUnlocked = docToUnlock.unlockedFor || [];
    setSelectedStudentIds(currentUnlocked);
    
    setShowUnlockModal(true);
  };

  const toggleStudentSelection = (studentId, event) => {
    // Prevent event propagation if called from checkbox directly
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedStudentIds(prev => {
      const isCurrentlySelected = prev.includes(studentId);
      console.log('Toggling student:', studentId, 'currently selected:', isCurrentlySelected);
      
      if (isCurrentlySelected) {
        const newSelection = prev.filter(id => id !== studentId);
        console.log('Deselecting student, new selection:', newSelection);
        return newSelection;
      } else {
        const newSelection = [...prev, studentId];
        console.log('Selecting student, new selection:', newSelection);
        return newSelection;
      }
    });
  };

  const handleSaveUnlock = async () => {
    if (!selectedDocForUnlock) return;

    try {
      const lessonRef = doc(
        db,
        'courses',
        selectedClass.id,
        'levels',
        selectedLevel.id,
        'lessons',
        selectedLesson.id
      );

      // Store array of student UIDs/IDs for NextElite to check
      // NextElite should filter documents where: unlockedFor.includes(student.uid) || unlockedFor.includes(student.id)
      // If unlockedFor is empty array [], document is locked for all students
      // If unlockedFor has student IDs, only those students can see it
      const updatedDocs = documents.map(doc => 
        doc.id === selectedDocForUnlock.id 
          ? { ...doc, unlockedFor: selectedStudentIds } // Array of student UIDs/IDs
          : doc
      );

      await updateDoc(lessonRef, {
        documents: updatedDocs
      });

      setDocuments(updatedDocs);
      setShowUnlockModal(false);
      setSelectedDocForUnlock(null);
      setSelectedStudentIds([]);
      await onReload();
    } catch (error) {
      console.error('Error updating unlock status:', error);
      alert('Failed to update document access: ' + error.message);
    }
  };

  const handleViewDocument = async (docToView) => {
    // Log the view
    try {
      // Store view log in a separate collection for easier querying
      const viewLogsCollection = collection(db, 'documentViewLogs');
      await addDoc(viewLogsCollection, {
        userId: auth.currentUser?.uid || 'unknown',
        userEmail: auth.currentUser?.email || 'unknown',
        userName: auth.currentUser?.displayName || 'Unknown User',
        viewedAt: new Date().toISOString(),
        documentId: docToView.id,
        documentName: docToView.name,
        courseId: selectedClass.id,
        courseName: selectedClass.name,
        levelId: selectedLevel.id,
        levelName: selectedLevel.name,
        lessonId: selectedLesson.id,
        lessonName: selectedLesson.name
      });

      // Also update the document's viewLogs array in the lesson for quick access
      const lessonRef = doc(
        db,
        'courses',
        selectedClass.id,
        'levels',
        selectedLevel.id,
        'lessons',
        selectedLesson.id
      );

      const updatedDocs = documents.map(doc => {
        if (doc.id === docToView.id) {
          return {
            ...doc,
            viewLogs: [
              ...(doc.viewLogs || []),
              {
                userId: auth.currentUser?.uid || 'unknown',
                userEmail: auth.currentUser?.email || 'unknown',
                userName: auth.currentUser?.displayName || 'Unknown User',
                viewedAt: new Date().toISOString()
              }
            ]
          };
        }
        return doc;
      });

      await updateDoc(lessonRef, {
        documents: updatedDocs
      });

      setDocuments(updatedDocs);
    } catch (error) {
      console.error('Error logging view:', error);
      // Don't block the user from viewing, just log the error
    }
  };

  const loadViewLogs = async (docToView) => {
    try {
      // First try to get from the document's viewLogs array (quick access)
      const localLogs = docToView.viewLogs || [];
      
      // Also query the separate collection for complete logs
      const viewLogsCollection = collection(db, 'documentViewLogs');
      const q = query(
        viewLogsCollection,
        where('documentId', '==', docToView.id),
        where('lessonId', '==', selectedLesson.id),
        orderBy('viewedAt', 'desc')
      );
      
      let collectionLogs = [];
      try {
        const querySnapshot = await getDocs(q);
        collectionLogs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (queryError) {
        // If query fails (e.g., no index), just use local logs
        console.warn('Could not query view logs collection:', queryError);
      }

      // Merge and deduplicate logs (prefer collection logs if available)
      const allLogs = collectionLogs.length > 0 ? collectionLogs : localLogs;
      
      // Remove duplicates based on userId + viewedAt
      const uniqueLogs = allLogs.reduce((acc, log) => {
        const key = `${log.userId}_${log.viewedAt}`;
        if (!acc.find(l => `${l.userId}_${l.viewedAt}` === key)) {
          acc.push(log);
        }
        return acc;
      }, []);

      // Sort by viewedAt descending
      uniqueLogs.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

      setViewLogs(uniqueLogs);
      setSelectedDocForLog(docToView);
      setShowViewLog(true);
    } catch (error) {
      console.error('Error loading view logs:', error);
      // Fallback to local logs if available
      const localLogs = docToView.viewLogs || [];
      setViewLogs(localLogs);
      setSelectedDocForLog(docToView);
      setShowViewLog(true);
    }
  };

  const handleDeleteDocument = async (docToDelete) => {
    if (!confirm(`Are you sure you want to delete "${docToDelete.name}"?`)) {
      return;
    }

    try {
      // Delete from storage
      if (docToDelete.path) {
        const storageRef = ref(storage, docToDelete.path);
        await deleteObject(storageRef);
      }

      // Update Firestore
      const lessonRef = doc(
        db,
        'courses',
        selectedClass.id,
        'levels',
        selectedLevel.id,
        'lessons',
        selectedLesson.id
      );

      const updatedDocs = documents.filter(doc => doc.id !== docToDelete.id);
      await updateDoc(lessonRef, {
        documents: updatedDocs
      });

      setDocuments(updatedDocs);
      await onReload();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('video')) return '🎥';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('spreadsheet') || type?.includes('excel')) return '📊';
    return '📎';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-brand-primary mx-auto mb-4" size={32} />
          <p className="text-brand-primary">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-brand-primary hover:text-brand-accent font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Lessons
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-brand-primary mb-2">
            {selectedLesson.name}
          </h2>
          <p style={{ color: '#0F2E42' }}>
            {selectedClass.name} → {selectedLevel.name} → Lesson {selectedLesson.lessonNumber || ''}
          </p>
        </div>

        <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: '#1a4f62', backgroundColor: '#f0f5f7' }}>
          <div className="p-4 rounded-full d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px', backgroundColor: '#e8f0f3' }}>
            <Upload style={{ color: '#1a4f62' }} size={56} />
          </div>
          <h3 className="text-xl font-bold text-brand-primary mb-2">Upload Documents</h3>
          <p className="mb-4" style={{ color: '#0F2E42' }}>Drag and drop files here or click to browse</p>
          <label className="bg-brand-cta text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all cursor-pointer inline-block">
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader className="animate-spin" size={20} />
                Uploading...
              </span>
            ) : (
              'Choose Files'
            )}
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-brand-primary mb-4">
          Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: '#1a4f62', backgroundColor: '#f0f5f7' }}>
            <div className="p-4 rounded-full d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px', backgroundColor: '#e8f0f3' }}>
              <FileText style={{ color: '#1a4f62' }} size={64} />
            </div>
            <p className="text-brand-primary text-lg">No documents uploaded yet</p>
            <p className="text-sm mt-2" style={{ color: '#0F2E42' }}>Upload your first document to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, index) => {
              return (
              <div
                key={doc.id}
                className="border-2 rounded-lg p-4 transition-all card-hover bg-white"
                style={{ borderColor: '#4a6b7a' }}
                onMouseEnter={(e) => e.target.style.borderColor = '#1a4f62'}
                onMouseLeave={(e) => e.target.style.borderColor = '#4a6b7a'}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                    <span className="fs-3">{getFileIcon(doc.type)}</span>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h4 className="fw-semibold mb-1" style={{ color: '#7D633C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</h4>
                      <p className="small mb-0" style={{ color: '#0F2E42' }}>{formatFileSize(doc.size)}</p>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        {doc.unlockedFor && doc.unlockedFor.length > 0 ? (
                          <span className="badge" style={{ backgroundColor: '#10b981', color: 'white', fontSize: '10px' }}>
                            <Unlock size={12} className="me-1" />
                            Unlocked for {doc.unlockedFor.length} student{doc.unlockedFor.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px' }}>
                            <Lock size={12} className="me-1" />
                            Locked (all students)
                          </span>
                        )}
                        {doc.viewLogs && doc.viewLogs.length > 0 && (
                          <span className="small" style={{ color: '#6b8a9a' }}>
                            {doc.viewLogs.length} view{doc.viewLogs.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="btn btn-link text-danger p-1"
                    style={{ textDecoration: 'none' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="d-flex gap-2 mb-2">
                  <Button
                    onClick={() => handleOpenUnlockModal(doc)}
                    className="flex-fill"
                    size="sm"
                    style={{ 
                      backgroundColor: '#1a4f62',
                      border: 'none',
                      fontSize: '12px',
                      padding: '6px 12px'
                    }}
                  >
                    <Unlock size={14} className="me-1" />
                    Manage Access
                  </Button>
                  <Button
                    onClick={() => loadViewLogs(doc)}
                    className="flex-fill"
                    size="sm"
                    outline
                    style={{ 
                      borderColor: '#1a4f62',
                      color: '#1a4f62',
                      fontSize: '12px',
                      padding: '6px 12px'
                    }}
                  >
                    <Eye size={14} className="me-1" />
                    View Log
                  </Button>
                </div>
                
                <div className="d-flex gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-fill btn btn-sm text-white text-decoration-none d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#FF6B6B' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Download size={16} />
                    Download
                  </a>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-fill btn btn-sm btn-outline text-decoration-none d-flex align-items-center justify-content-center gap-2"
                    style={{ borderColor: '#1a4f62', color: '#1a4f62' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e8f0f3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => handleViewDocument(doc)}
                  >
                    <FileText size={16} />
                    View
                  </a>
                </div>
                
                {doc.uploadedAt && (
                  <p className="small mt-2 mb-0" style={{ color: '#6b8a9a' }}>
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Log Modal */}
      <Modal isOpen={showViewLog} toggle={() => setShowViewLog(false)} size="lg">
        <ModalHeader toggle={() => setShowViewLog(false)} style={{ backgroundColor: '#1a4f62', color: 'white' }}>
          View Log - {selectedDocForLog?.name}
        </ModalHeader>
        <ModalBody>
          {viewLogs.length === 0 ? (
            <p className="text-center text-muted py-4">No views recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Viewed At</th>
                  </tr>
                </thead>
                <tbody>
                  {viewLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.userName || 'Unknown User'}</td>
                      <td>{log.userEmail || 'N/A'}</td>
                      <td>{new Date(log.viewedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Unlock/Lock Modal */}
      <Modal isOpen={showUnlockModal} toggle={() => {
        setShowUnlockModal(false);
        setSelectedDocForUnlock(null);
        setSelectedStudentIds([]);
      }} size="lg">
        <ModalHeader toggle={() => {
          setShowUnlockModal(false);
          setSelectedDocForUnlock(null);
          setSelectedStudentIds([]);
        }} style={{ backgroundColor: '#1a4f62', color: 'white' }}>
          Manage Student Access - {selectedDocForUnlock?.name}
        </ModalHeader>
        <ModalBody>
          <p className="mb-3" style={{ color: '#0F2E42' }}>
            Select which students can access this document. Students not selected will not be able to see this document in the NextElite app.
          </p>
          
          {/* Search and Filter Controls */}
          <div className="mb-3">
            <div className="row g-2">
              <div className="col-md-6">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
              </div>
              <div className="col-md-6">
                <Input
                  type="select"
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name || cls.className || `Class ${cls.id}`}
                    </option>
                  ))}
                </Input>
              </div>
            </div>
          </div>
          
          {loadingStudents ? (
            <div className="text-center py-4">
              <Loader className="animate-spin" size={24} style={{ color: '#1a4f62' }} />
              <p className="mt-2" style={{ color: '#0F2E42' }}>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-muted py-4">
              {searchTerm || selectedClassFilter 
                ? 'No students match your search criteria.' 
                : 'No students found in the system.'}
            </p>
          ) : (
            <>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span style={{ color: '#0F2E42' }}>
                  {selectedStudentIds.length} of {students.length} student{students.length !== 1 ? 's' : ''} selected
                  {allStudents.length !== students.length && (
                    <span className="ms-2 small text-muted">
                      (filtered from {allStudents.length} total)
                    </span>
                  )}
                </span>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    outline
                    onClick={() => {
                      // Select all currently visible (filtered) students
                      const visibleIds = students.map(s => s.uid || s.id);
                      setSelectedStudentIds(prev => {
                        // Add visible students, keep already selected ones that are not visible
                        const hiddenSelected = prev.filter(id => !visibleIds.includes(id));
                        return [...hiddenSelected, ...visibleIds];
                      });
                    }}
                    style={{ borderColor: '#1a4f62', color: '#1a4f62', fontSize: '12px' }}
                  >
                    Select All Visible
                  </Button>
                  <Button
                    size="sm"
                    outline
                    onClick={() => {
                      // Deselect only visible students
                      const visibleIds = students.map(s => s.uid || s.id);
                      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
                    }}
                    style={{ borderColor: '#1a4f62', color: '#1a4f62', fontSize: '12px' }}
                  >
                    Deselect Visible
                  </Button>
                </div>
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.uid || student.id);
                  return (
                    <div
                      key={student.uid || student.id}
                      className="d-flex align-items-center p-3 mb-2 border rounded"
                      style={{
                        backgroundColor: isSelected ? '#e8f0f3' : 'white',
                        borderColor: isSelected ? '#1a4f62' : '#e5e7eb',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        // Only toggle if clicking on the div, not the checkbox
                        if (e.target.type !== 'checkbox') {
                          toggleStudentSelection(student.uid || student.id, e);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleStudentSelection(student.uid || student.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="me-3"
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium" style={{ color: '#7D633C' }}>{student.name}</div>
                        <div className="small" style={{ color: '#6b8a9a' }}>{student.email}</div>
                        {(() => {
                          // Show enrolled classes if available
                          const enrolledClasses = student.enrolledClasses || student.classes || student.classIds || [];
                          const classId = student.classId || student.class;
                          
                          if (Array.isArray(enrolledClasses) && enrolledClasses.length > 0) {
                            const classNames = enrolledClasses
                              .map(c => {
                                if (typeof c === 'object' && c !== null) {
                                  return c.name || courses.find(course => course.id === c.id)?.name;
                                }
                                return courses.find(course => course.id === c)?.name;
                              })
                              .filter(Boolean);
                            
                            if (classNames.length > 0) {
                              return (
                                <div className="small mt-1" style={{ color: '#1a4f62' }}>
                                  Enrolled: {classNames.join(', ')}
                                </div>
                              );
                            }
                          } else if (classId) {
                            const course = courses.find(c => c.id === classId);
                            if (course) {
                              return (
                                <div className="small mt-1" style={{ color: '#1a4f62' }}>
                                  Enrolled: {course.name}
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                      {isSelected && (
                        <Unlock size={20} style={{ color: '#10b981' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          <div className="d-flex gap-2 mt-4">
            <Button
              onClick={() => {
                setShowUnlockModal(false);
                setSelectedDocForUnlock(null);
                setSelectedStudentIds([]);
              }}
              outline
              className="flex-fill"
              style={{ borderColor: '#d1d5db', color: '#7D633C' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUnlock}
              className="flex-fill"
              style={{ backgroundColor: '#FF6B6B', border: 'none' }}
            >
              Save Access Settings
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default LessonDocuments;

