import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input, Button } from 'reactstrap';

const ClassModal = ({ class: classData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        description: classData.description || ''
      });
    }
  }, [classData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a course name');
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
        {classData ? 'Edit Course' : 'Create New Course'}
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label style={{ color: '#7D633C', fontWeight: '600' }}>
              Course Name *
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., English Drama"
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
              placeholder="Enter course description..."
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
              {classData ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
};

export default ClassModal;

