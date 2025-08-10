import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import StockMarket from '../pages/StockMarket';
import PlayerManagement from '../pages/PlayerManagement';
import DebtManagement from '../pages/DebtManagement';
import LotteryGame from '../pages/LotteryGame';
import StockProfitAnalysis from '../pages/StockProfitAnalysis';
import ChanceFate from '../pages/ChanceFate';
import Insurance from '../pages/Insurance';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'stocks',
        element: <StockMarket />
      },
      {
        path: 'players',
        element: <PlayerManagement />
      },
      {
        path: 'debts',
        element: <DebtManagement />
      },
      {
        path: 'lottery',
        element: <LotteryGame />
      },
      {
        path: 'profit-analysis',
        element: <StockProfitAnalysis />
      },
      {
        path: 'chance-fate',
        element: <ChanceFate />
      },
      {
        path: 'insurance',
        element: <Insurance />
      }
    ]
  }
], {
  basename: '/clean-yellow'
});