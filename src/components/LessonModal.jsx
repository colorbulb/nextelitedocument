import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input, Button } from 'reactstrap';

const LessonModal = ({ lesson, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lessonNumber: ''
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        name: lesson.name || '',
        description: lesson.description || '',
        lessonNumber: lesson.lessonNumber || ''
      });
    }
  }, [lesson]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a lesson name');
      return;
    }
    onSave(formData);
  };

  return (
    <Modal isOpen={true} toggle={onClose} centered>
      <ModalHeader 
        toggle={onClose}
        style={{ backgroundColor: '#1a4f62', color: 'white' }}
      >
        {lesson ? 'Edit Lesson' : 'Create New Lesson'}
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label style={{ color: '#7D633C', fontWeight: '600' }}>
              Lesson Number
            </Label>
            <Input
              type="number"
              value={formData.lessonNumber}
              onChange={(e) => setFormData({ ...formData, lessonNumber: e.target.value })}
              placeholder="e.g., 1, 2, 3..."
              min="1"
              style={{ 
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label style={{ color: '#7D633C', fontWeight: '600' }}>
              Lesson Name *
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Introduction to Drama, Character Development"
              required
              style={{ 
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label style={{ color: '#7D633C', fontWeight: '600' }}>
              Description
            </Label>
            <Input
              type="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter lesson description..."
              rows="4"
              style={{ 
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            />
          </FormGroup>

          <div className="d-flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              outline
              className="flex-fill"
              style={{ 
                borderColor: '#d1d5db',
                color: '#7D633C',
                padding: '12px',
                borderRadius: '8px'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-fill"
              style={{ 
                backgroundColor: '#FF6B6B',
                border: 'none',
                padding: '12px',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {lesson ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
};

export default LessonModal;

