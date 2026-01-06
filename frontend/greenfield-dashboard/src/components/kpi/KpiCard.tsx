import { Card, CardContent, Typography } from '@mui/material';

export default function KpiCard({ title, value, unit }:{title:string; value:string|number; unit?:string}) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4">{value}{unit ? ` ${unit}` : ''}</Typography>
      </CardContent>
    </Card>
  );
}
