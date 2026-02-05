import React from 'react';
import '../../styles/Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'title' | 'avatar' | 'button' | 'badge' | 'card';
  count?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className = '',
  variant = 'text',
  count = 1,
  style: customStyle
}) => {
  const baseClasses = `skeleton skeleton-${variant}`;
  const style: React.CSSProperties = {
    width: width || (variant === 'avatar' ? '40px' : variant === 'button' ? '120px' : '100%'),
    height: height || (variant === 'avatar' ? '40px' : variant === 'button' ? '40px' : '1em'),
    ...customStyle,
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${baseClasses} ${className}`} style={style} />
        ))}
      </>
    );
  }

  return <div className={`${baseClasses} ${className}`} style={style} />;
};

export const SkeletonTaskCard: React.FC = () => (
  <div className="skeleton skeleton-task-card">
    <div className="skeleton-task-header">
      <Skeleton variant="badge" width="80px" height="24px" />
      <Skeleton variant="avatar" width="24px" height="24px" />
    </div>
    <Skeleton variant="title" width="100%" height="20px" />
    <div className="skeleton-task-footer">
      <Skeleton variant="text" width="100px" />
      <Skeleton variant="avatar" width="28px" height="28px" />
    </div>
  </div>
);

export const SkeletonColumn: React.FC = () => (
  <div className="skeleton-column">
    <div className="skeleton-column-header">
      <Skeleton variant="text" width="8px" height="8px" />
      <Skeleton variant="title" width="100px" height="20px" />
      <Skeleton variant="badge" width="30px" height="20px" />
    </div>
    <SkeletonTaskCard />
    <SkeletonTaskCard />
    <SkeletonTaskCard />
  </div>
);

export const SkeletonMetricCard: React.FC = () => (
  <div className="skeleton skeleton-metric-card">
    <Skeleton variant="avatar" width="48px" height="48px" className="skeleton-metric-icon" />
    <div className="skeleton-metric-content">
      <Skeleton variant="text" width="100px" height="14px" className="skeleton-metric-label" />
      <Skeleton variant="title" width="60px" height="28px" className="skeleton-metric-value" />
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div>
    <Skeleton variant="title" width="300px" height="32px" />
    <Skeleton variant="text" width="500px" height="16px" />
    <div>
      <SkeletonMetricCard />
      <SkeletonMetricCard />
      <SkeletonMetricCard />
      <SkeletonMetricCard />
    </div>
  </div>
);

export default Skeleton;

