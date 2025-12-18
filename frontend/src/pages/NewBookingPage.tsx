import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreateBookingModal from '../components/CreateBookingModal';

export default function NewBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillSitterProfileId = useMemo(() => {
    const sitterProfileIdParam = searchParams.get('sitterProfileId');
    return sitterProfileIdParam ?? '';
  }, [searchParams]);

  return (
    <CreateBookingModal
      variant="page"
      prefillSitterProfileId={prefillSitterProfileId}
      onClose={() => {
        navigate('/bookings');
      }}
      onSuccess={() => {
        navigate('/bookings');
      }}
    />
  );
}
