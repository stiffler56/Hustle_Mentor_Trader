import { RouterProvider } from 'react-router';
import { router } from './routes';
import { TradesProvider } from './data/TradesContext';
import { ChallengeProvider } from './data/ChallengeContext';
import { ThemeProvider } from './data/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <TradesProvider>
        <ChallengeProvider>
          <RouterProvider router={router} />
        </ChallengeProvider>
      </TradesProvider>
    </ThemeProvider>
  );
}