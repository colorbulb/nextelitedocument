import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { LogOut, Plus, BookOpen, Layers, FileText, Upload, Download } from 'lucide-react';
import { Container, Navbar, NavbarBrand, Nav, NavItem, Button, Card, CardBody } from 'reactstrap';
import { db } from '../firebase/config';
import ClassCard from './ClassCard';
import ClassModal from './ClassModal';
import LevelModal from './LevelModal';
import LessonModal from './LessonModal';
import LessonDocuments from './LessonDocuments';
import logo from '/logo.png';

const AdminDashboard = ({ currentUser, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  // Helper function to refresh selected items after data reload
  const refreshSelectedItems = () => {
    if (selectedClass && classes.length > 0) {
      const updatedClass = classes.find(c => c.id === selectedClass.id);
      if (updatedClass) {
        setSelectedClass(updatedClass);
        if (selectedLevel) {
          const updatedLevel = updatedClass.levels?.find(l => l.id === selectedLevel.id);
          if (updatedLevel) {
            setSelectedLevel(updatedLevel);
            if (selectedLesson) {
              const updatedLesson = updatedLevel.lessons?.find(les => les.id === selectedLesson.id);
              if (updatedLesson) {
                setSelectedLesson(updatedLesson);
              } else {
                setSelectedLesson(null);
              }
            }
          } else {
            setSelectedLevel(null);
            setSelectedLesson(null);
          }
        }
      } else {
        setSelectedClass(null);
        setSelectedLevel(null);
        setSelectedLesson(null);
      }
    }
  };

  // Refresh selected items when classes data changes
  useEffect(() => {
    if (classes.length > 0 && selectedClass) {
      refreshSelectedItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const classesSnapshot = await getDocs(collection(db, 'courses'));
      const classesData = [];
      
      for (const classDoc of classesSnapshot.docs) {
        const classData = { id: classDoc.id, ...classDoc.data() };
        
        // Load levels for each class
        const levelsSnapshot = await getDocs(collection(db, 'courses', classDoc.id, 'levels'));
        const levelsData = [];
        
        for (const levelDoc of levelsSnapshot.docs) {
          const levelData = { id: levelDoc.id, ...levelDoc.data() };
          
          // Load lessons for each level
          const lessonsSnapshot = await getDocs(
            collection(db, 'courses', classDoc.id, 'levels', levelDoc.id, 'lessons')
          );
          const lessonsData = lessonsSnapshot.docs.map(lessonDoc => ({
            id: lessonDoc.id,
            ...lessonDoc.data()
          }));
          
          // Sort lessons by lessonNumber (ascending: 1, 2, 3...)
          lessonsData.sort((a, b) => {
            const numA = parseInt(a.lessonNumber || '0', 10);
            const numB = parseInt(b.lessonNumber || '0', 10);
            // If both are valid numbers, sort numerically
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            // If only one is a number, number comes first
            if (!isNaN(numA) && isNaN(numB)) return -1;
            if (isNaN(numA) && !isNaN(numB)) return 1;
            // If neither is a number, sort alphabetically by lessonNumber string
            return (a.lessonNumber || '').localeCompare(b.lessonNumber || '');
          });
          
          levelData.lessons = lessonsData;
          levelsData.push(levelData);
        }
        
        classData.levels = levelsData;
        classesData.push(classData);
      }
      
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
      alert('Failed to load classes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (classData) => {
    try {
      await addDoc(collection(db, 'courses'), {
        ...classData,
        createdAt: new Date().toISOString()
      });
      await loadClasses();
      setShowClassModal(false);
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class: ' + error.message);
    }
  };

  const handleUpdateClass = async (classId, classData) => {
    try {
      await updateDoc(doc(db, 'courses', classId), classData);
      await loadClasses();
      setShowClassModal(false);
      setEditingClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class: ' + error.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('Are you sure you want to delete this class? This will delete all levels, lessons, and documents.')) {
      return;
    }
    
    try {
      // Delete all levels, lessons, and documents (Firestore doesn't support cascade delete)
      const classRef = doc(db, 'courses', classId);
      const levelsSnapshot = await getDocs(collection(db, 'courses', classId, 'levels'));
      
      for (const levelDoc of levelsSnapshot.docs) {
        const lessonsSnapshot = await getDocs(
          collection(db, 'courses', classId, 'levels', levelDoc.id, 'lessons')
        );
        
        for (const lessonDoc of lessonsSnapshot.docs) {
          await deleteDoc(doc(db, 'courses', classId, 'levels', levelDoc.id, 'lessons', lessonDoc.id));
        }
        
        await deleteDoc(doc(db, 'courses', classId, 'levels', levelDoc.id));
      }
      
      await deleteDoc(classRef);
      await loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class: ' + error.message);
    }
  };

  const handleCreateLevel = async (levelData) => {
    try {
      await addDoc(collection(db, 'courses', selectedClass.id, 'levels'), {
        ...levelData,
        createdAt: new Date().toISOString()
      });
      await loadClasses();
      setShowLevelModal(false);
    } catch (error) {
      console.error('Error creating level:', error);
      alert('Failed to create level: ' + error.message);
    }
  };

  const handleUpdateLevel = async (levelId, levelData) => {
    try {
      await updateDoc(doc(db, 'courses', selectedClass.id, 'levels', levelId), levelData);
      await loadClasses();
      setShowLevelModal(false);
      setEditingLevel(null);
      // Refresh will be handled by loadClasses
    } catch (error) {
      console.error('Error updating level:', error);
      alert('Failed to update level: ' + error.message);
    }
  };

  const handleDeleteLevel = async (levelId) => {
    if (!confirm('Are you sure you want to delete this level? This will delete all lessons and documents.')) {
      return;
    }
    
    try {
      const lessonsSnapshot = await getDocs(
        collection(db, 'courses', selectedClass.id, 'levels', levelId, 'lessons')
      );
      
      for (const lessonDoc of lessonsSnapshot.docs) {
        await deleteDoc(doc(db, 'courses', selectedClass.id, 'levels', levelId, 'lessons', lessonDoc.id));
      }
      
      await deleteDoc(doc(db, 'courses', selectedClass.id, 'levels', levelId));
      await loadClasses();
      setSelectedLevel(null);
    } catch (error) {
      console.error('Error deleting level:', error);
      alert('Failed to delete level: ' + error.message);
    }
  };

  const handleCreateLesson = async (lessonData) => {
    try {
      await addDoc(
        collection(db, 'courses', selectedClass.id, 'levels', selectedLevel.id, 'lessons'),
        {
          ...lessonData,
          createdAt: new Date().toISOString(),
          documents: []
        }
      );
      await loadClasses();
      setShowLessonModal(false);
      // Refresh will be handled by loadClasses
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to create lesson: ' + error.message);
    }
  };

  const handleUpdateLesson = async (lessonId, lessonData) => {
    try {
      await updateDoc(
        doc(db, 'courses', selectedClass.id, 'levels', selectedLevel.id, 'lessons', lessonId),
        lessonData
      );
      await loadClasses();
      setShowLessonModal(false);
      setEditingLesson(null);
      // Refresh will be handled by loadClasses
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Failed to update lesson: ' + error.message);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson? This will delete all documents.')) {
      return;
    }
    
    try {
      await deleteDoc(
        doc(db, 'courses', selectedClass.id, 'levels', selectedLevel.id, 'lessons', lessonId)
      );
      await loadClasses();
      setSelectedLesson(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson: ' + error.message);
    }
  };

  const handleImportFromNextElite = async () => {
    if (!confirm('This will READ-ONLY import classes from NextElite and create courses in NextDoc. No changes will be made to NextElite data. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      
      // READ-ONLY: Fetch classes from nextelite's 'classes' collection (only reading, not writing)
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const nextEliteClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (nextEliteClasses.length === 0) {
        alert('No classes found in NextElite');
        setLoading(false);
        return;
      }

      // Group classes by classGroupName or name
      const classGroups = {};
      nextEliteClasses.forEach(cls => {
        const groupName = cls.classGroupName || cls.name || 'Unnamed Course';
        if (!classGroups[groupName]) {
          classGroups[groupName] = [];
        }
        classGroups[groupName].push(cls);
      });

      // Create courses from class groups
      let importedCount = 0;
      for (const [groupName, groupClasses] of Object.entries(classGroups)) {
        // Check if course already exists
        const existingCourses = classes.filter(c => c.name === groupName);
        if (existingCourses.length > 0) {
          console.log(`Course "${groupName}" already exists, skipping...`);
          continue;
        }

        // Get number of sessions from the class data
        // Try to find the highest numberOfSessions in the group (in case they differ)
        // Convert to number and ensure it's valid
        let numberOfSessions = 0;
        for (const cls of groupClasses) {
          if (cls.numberOfSessions) {
            const sessions = parseInt(cls.numberOfSessions, 10);
            if (!isNaN(sessions) && sessions > numberOfSessions) {
              numberOfSessions = sessions;
            }
          }
        }
        
        // If no valid numberOfSessions found, skip this group
        if (numberOfSessions === 0) {
          console.log(`Course "${groupName}" has no valid numberOfSessions, skipping...`);
          continue;
        }
        
        // Create course (only writes to 'courses' collection, not 'classes')
        const courseRef = await addDoc(collection(db, 'courses'), {
          name: groupName,
          description: `Imported from NextElite. ${groupClasses.length} timeslot(s), ${numberOfSessions} sessions per class.`,
          importedFrom: 'nextelite',
          createdAt: new Date().toISOString()
        });

        // Create a default level
        const levelRef = await addDoc(collection(db, 'courses', courseRef.id, 'levels'), {
          name: 'Default Level',
          description: 'Default level for imported course',
          createdAt: new Date().toISOString()
        });

        // Create lessons based on actual numberOfSessions from NextElite
        for (let i = 1; i <= numberOfSessions; i++) {
          await addDoc(collection(db, 'courses', courseRef.id, 'levels', levelRef.id, 'lessons'), {
            name: `Lesson ${i}`,
            description: `Lesson ${i} for ${groupName}`,
            lessonNumber: i.toString(),
            documents: [],
            createdAt: new Date().toISOString()
          });
        }

        importedCount++;
      }

      await loadClasses();
      alert(`Successfully imported ${importedCount} course(s) from NextElite!`);
    } catch (error) {
      console.error('Error importing from NextElite:', error);
      alert('Failed to import classes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-neutral">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary mx-auto mb-4"></div>
          <p className="text-brand-primary text-lg font-medium">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-neutral">
      {/* Header */}
      <Navbar expand="md" style={{ backgroundColor: '#1a4f62' }} className="shadow-lg">
        <Container fluid className="d-flex align-items-center">
          <NavbarBrand className="text-white d-flex align-items-center gap-3 flex-grow-0">
            <img src={logo} width="100px" alt="Logo" />
            <div>
              <h1 className="h4 mb-0 fw-bold">NextDoc - Document Management</h1>
              <p className="small mb-0 opacity-90">Course Curriculum Platform</p>
            </div>
          </NavbarBrand>
          <div className="ms-auto d-flex align-items-center gap-3">
            <div style={{ backgroundColor: '#1a4f62', borderRadius: '8px', padding: '8px 16px' }}>
              <span className="text-white fw-medium">{currentUser.displayName}</span>
              <span className="text-white small ms-2" style={{ backgroundColor: '#1a4f62', padding: '4px 8px', borderRadius: '4px' }}>
                Admin
              </span>
            </div>
            <Button
              onClick={onLogout}
              style={{ 
                backgroundColor: '#1a4f62',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1a5f72'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#1a4f62'}
            >
              <LogOut size={24} className="text-white" />
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-4">
        {!selectedClass ? (
          // Class Selection View
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h2 fw-bold" style={{ color: '#7D633C' }}>Courses</h2>
              <div className="d-flex gap-3">
                <Button
                  onClick={handleImportFromNextElite}
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#1a4f62',
                    border: 'none',
                    padding: '12px 24px'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Download size={24} className="me-2" />
                  Import from NextElite
                </Button>
                <Button
                  onClick={() => {
                    setEditingClass(null);
                    setShowClassModal(true);
                  }}
                  style={{ 
                    backgroundColor: '#FF6B6B',
                    border: 'none',
                    padding: '12px 24px'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Plus size={24} className="me-2" />
                  Create Course
                </Button>
              </div>
            </div>

            <div className="row g-4">
              {classes.map((classItem) => (
                <div key={classItem.id} className="col-12 col-lg-4">
                  <ClassCard
                    classItem={classItem}
                    onSelect={() => setSelectedClass(classItem)}
                    onEdit={() => {
                      setEditingClass(classItem);
                      setShowClassModal(true);
                    }}
                    onDelete={() => handleDeleteClass(classItem.id)}
                  />
                </div>
              ))}
            </div>

            {classes.length === 0 && (
              <Card className="border-2 border-dashed text-center" style={{ borderColor: '#1a4f62' }}>
                <CardBody className="p-5">
                  <div className="p-4 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px', backgroundColor: '#e8f0f3' }}>
                    <BookOpen size={64} style={{ color: '#1a4f62' }} />
                  </div>
                  <p className="h5 mb-4" style={{ color: '#7D633C' }}>No courses yet</p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      onClick={handleImportFromNextElite}
                      disabled={loading}
                      style={{ 
                        backgroundColor: '#1a4f62',
                        border: 'none',
                        padding: '12px 24px'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Import from NextElite
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingClass(null);
                        setShowClassModal(true);
                      }}
                      style={{ 
                        backgroundColor: '#FF6B6B',
                        border: 'none',
                        padding: '12px 24px'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Create Your First Course
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        ) : !selectedLevel ? (
          // Level Selection View
          <div>
            <div className="d-flex align-items-center gap-4 mb-4">
              <Button
                onClick={() => {
                  setSelectedClass(null);
                  setSelectedLevel(null);
                  setSelectedLesson(null);
                }}
                color="link"
                style={{ color: '#7D633C', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = '#1a4f62'}
                onMouseLeave={(e) => e.target.style.color = '#7D633C'}
              >
                ← Back to Courses
              </Button>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="h2 fw-bold" style={{ color: '#7D633C' }}>{selectedClass.name}</h2>
                <p className="mt-1" style={{ color: '#0F2E42' }}>{selectedClass.description}</p>
              </div>
              <Button
                onClick={() => {
                  setEditingLevel(null);
                  setShowLevelModal(true);
                }}
                style={{ 
                  backgroundColor: '#FF6B6B',
                  border: 'none',
                  padding: '12px 24px'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <Plus size={24} className="me-2" />
                Add Level
              </Button>
            </div>

            <div className="row g-4">
              {selectedClass.levels?.map((level, index) => {
                return (
                  <div key={level.id} className="col-12 col-lg-4">
                  <Card
                    className="card-hover border-0 shadow-lg h-100"
                    style={{ 
                      borderRadius: '12px',
                      border: '2px solid #4a6b7a',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedLevel(level)}
                  >
                    <CardBody className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded" style={{ backgroundColor: '#e8f0f3' }}>
                          <Layers style={{ color: '#1a4f62' }} size={48} />
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLevel(level);
                              setShowLevelModal(true);
                            }}
                            style={{ 
                              backgroundColor: '#1a4f62',
                              border: 'none',
                              padding: '6px 12px',
                              fontSize: '14px'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLevel(level.id);
                            }}
                            color="danger"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <h3 className="h5 fw-bold mb-2" style={{ color: '#7D633C' }}>{level.name}</h3>
                      <p className="small mb-3" style={{ color: '#0F2E42' }}>{level.description}</p>
                      <div className="d-flex align-items-center gap-2 small fw-medium" style={{ color: '#0F2E42' }}>
                        <FileText size={20} />
                        <span>{level.lessons?.length || 0} Lessons</span>
                      </div>
                    </CardBody>
                  </Card>
                  </div>
                );
              })}
            </div>

            {(!selectedClass.levels || selectedClass.levels.length === 0) && (
              <Card className="border-2 border-dashed text-center" style={{ borderColor: '#1a4f62' }}>
                <CardBody className="p-5">
                  <div className="p-4 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px', backgroundColor: '#e8f0f3' }}>
                    <Layers size={64} style={{ color: '#1a4f62' }} />
                  </div>
                  <p className="h5 mb-4" style={{ color: '#7D633C' }}>No levels yet</p>
                  <Button
                    onClick={() => {
                      setEditingLevel(null);
                      setShowLevelModal(true);
                    }}
                    style={{ 
                      backgroundColor: '#FF6B6B',
                      border: 'none',
                      padding: '12px 24px'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Add First Level
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        ) : !selectedLesson ? (
          // Lesson Selection View
          <div>
            <div className="d-flex align-items-center gap-4 mb-4">
              <Button
                onClick={() => {
                  setSelectedLevel(null);
                  setSelectedLesson(null);
                }}
                color="link"
                style={{ color: '#7D633C', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = '#1a4f62'}
                onMouseLeave={(e) => e.target.style.color = '#7D633C'}
              >
                ← Back to Levels
              </Button>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="h2 fw-bold" style={{ color: '#7D633C' }}>
                  {selectedClass.name} - {selectedLevel.name}
                </h2>
                <p className="mt-1" style={{ color: '#0F2E42' }}>{selectedLevel.description}</p>
              </div>
              <Button
                onClick={() => {
                  setEditingLesson(null);
                  setShowLessonModal(true);
                }}
                style={{ 
                  backgroundColor: '#FF6B6B',
                  border: 'none',
                  padding: '12px 24px'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <Plus size={24} className="me-2" />
                Add Lesson
              </Button>
            </div>

            <div className="row g-4">
              {selectedLevel.lessons
                ?.sort((a, b) => {
                  const numA = parseInt(a.lessonNumber || '0', 10);
                  const numB = parseInt(b.lessonNumber || '0', 10);
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                  if (!isNaN(numA) && isNaN(numB)) return -1;
                  if (isNaN(numA) && !isNaN(numB)) return 1;
                  return (a.lessonNumber || '').localeCompare(b.lessonNumber || '');
                })
                ?.map((lesson, index) => {
                return (
                  <div key={lesson.id} className="col-12 col-lg-4">
                  <Card
                    className="card-hover border-0 shadow-lg h-100"
                    style={{ 
                      borderRadius: '12px',
                      border: '2px solid #4a6b7a',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardBody className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded" style={{ backgroundColor: '#e8f0f3' }}>
                          <FileText style={{ color: '#1a4f62' }} size={48} />
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLesson(lesson);
                              setShowLessonModal(true);
                            }}
                            style={{ 
                              backgroundColor: '#1a4f62',
                              border: 'none',
                              padding: '6px 12px',
                              fontSize: '14px'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLesson(lesson.id);
                            }}
                            color="danger"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <h3 className="h5 fw-bold mb-2" style={{ color: '#7D633C' }}>{lesson.name}</h3>
                      <p className="small mb-3" style={{ color: '#0F2E42' }}>{lesson.description}</p>
                      <div className="d-flex align-items-center gap-2 small fw-medium" style={{ color: '#0F2E42' }}>
                        <Upload size={20} />
                        <span>{lesson.documents?.length || 0} Documents</span>
                      </div>
                    </CardBody>
                  </Card>
                  </div>
                );
              })}
            </div>

            {(!selectedLevel.lessons || selectedLevel.lessons.length === 0) && (
              <Card className="border-2 border-dashed text-center" style={{ borderColor: '#1a4f62' }}>
                <CardBody className="p-5">
                  <div className="p-4 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px', backgroundColor: '#e8f0f3' }}>
                    <FileText size={64} style={{ color: '#1a4f62' }} />
                  </div>
                  <p className="h5 mb-4" style={{ color: '#7D633C' }}>No lessons yet</p>
                  <Button
                    onClick={() => {
                      setEditingLesson(null);
                      setShowLessonModal(true);
                    }}
                    style={{ 
                      backgroundColor: '#FF6B6B',
                      border: 'none',
                      padding: '12px 24px'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Add First Lesson
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        ) : (
          // Document Management View
          <LessonDocuments
            selectedClass={selectedClass}
            selectedLevel={selectedLevel}
            selectedLesson={selectedLesson}
            onBack={() => {
              setSelectedLesson(null);
              loadClasses();
            }}
            onReload={loadClasses}
          />
        )}
      </Container>

      {/* Modals */}
      {showClassModal && (
        <ClassModal
          class={editingClass}
          onClose={() => {
            setShowClassModal(false);
            setEditingClass(null);
          }}
          onSave={editingClass ? 
            (data) => handleUpdateClass(editingClass.id, data) :
            handleCreateClass
          }
        />
      )}

      {showLevelModal && selectedClass && (
        <LevelModal
          level={editingLevel}
          onClose={() => {
            setShowLevelModal(false);
            setEditingLevel(null);
          }}
          onSave={editingLevel ?
            (data) => handleUpdateLevel(editingLevel.id, data) :
            handleCreateLevel
          }
        />
      )}

      {showLessonModal && selectedClass && selectedLevel && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => {
            setShowLessonModal(false);
            setEditingLesson(null);
          }}
          onSave={editingLesson ?
            (data) => handleUpdateLesson(editingLesson.id, data) :
            handleCreateLesson
          }
        />
      )}
    </div>
  );
};

export default AdminDashboard;

