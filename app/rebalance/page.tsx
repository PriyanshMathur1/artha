import { RebalanceReport } from '@/components/Portfolio/RebalanceReport';

export const metadata = { title: 'Portfolio Rebalancer — Artha Terminal' };

export default function RebalancePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RebalanceReport />
    </div>
  );
}
