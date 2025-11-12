import { Container } from '@mui/material';
import { LabEnvironment } from '@components/labs';

export default function LabDetailPage(): JSX.Element {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <LabEnvironment />
    </Container>
  );
}
