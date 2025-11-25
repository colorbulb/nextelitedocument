import React from 'react';
import { BookOpen, Layers, Edit, Trash2 } from 'lucide-react';
import { Card, CardBody, Button } from 'reactstrap';

const ClassCard = ({ classItem, onSelect, onEdit, onDelete }) => {
  const totalLessons = classItem.levels?.reduce((sum, level) => sum + (level.lessons?.length || 0), 0) || 0;
  const totalLevels = classItem.levels?.length || 0;

  return (
    <Card 
      className="card-hover border-0 shadow-lg" 
      style={{ 
        borderRadius: '12px',
        border: '2px solid #4a6b7a',
        cursor: 'pointer'
      }}
      onClick={onSelect}
    >
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="p-3 rounded" style={{ backgroundColor: '#e8f0f3' }}>
            <BookOpen style={{ color: '#1a4f62' }} size={48} />
          </div>
          <div className="d-flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{ 
                backgroundColor: '#1a4f62',
                border: 'none',
                padding: '8px 12px'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <Edit size={20} />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              color="danger"
              style={{ padding: '8px 12px' }}
            >
              <Trash2 size={20} />
            </Button>
          </div>
        </div>
        <h3 className="h5 fw-bold mb-2" style={{ color: '#7D633C' }}>{classItem.name}</h3>
        <p className="text-muted small mb-3" style={{ 
          color: '#0F2E42',
          minHeight: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {classItem.description || 'No description'}
        </p>
        <div className="d-flex gap-4 small">
          <div className="d-flex align-items-center gap-1 fw-medium" style={{ color: '#0F2E42' }}>
            <Layers size={20} />
            <span>{totalLevels} Levels</span>
          </div>
          <div className="d-flex align-items-center gap-1 fw-medium" style={{ color: '#0F2E42' }}>
            <BookOpen size={20} />
            <span>{totalLessons} Lessons</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ClassCard;

