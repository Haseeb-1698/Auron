import { Typography, Container } from '@mui/material';

export default function LabDetailPage(): JSX.Element {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Lab Detail Page
      </Typography>
      <Typography>
        Lab details and exercises will be displayed here.
      </Typography>
    </Container>
  );
}
