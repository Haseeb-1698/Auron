import { Container } from '@mui/material';
import { ProgressDashboard } from '@components/progress';

export default function DashboardPage(): JSX.Element {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <ProgressDashboard />
    </Container>
  );
}
