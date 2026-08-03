import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// History page has been merged into My Bookings for a better experience
const History = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/bookings', { replace: true });
  }, [navigate]);
  return null;
};

export default History;
