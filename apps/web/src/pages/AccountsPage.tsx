import React, { useState } from 'react';
import { useWallets, useDeleteWallet, WalletCard, WalletFormModal } from '@/features/wallets';
import { useCategories, useDeleteCategory, CategoryList, CategoryFormModal } from '@/features/categories';
import { Money } from '@/components/Money';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { data: wallets = [], isLoading: isLoadingWallets } = useWallets();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();

  const deleteWalletMutation = useDeleteWallet();
  const deleteCategoryMutation = useDeleteCategory();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallets' | 'categories'>('wallets');

  // Compute total balance across all wallets
  const totalBalancePaisa = wallets.reduce((acc, w) => {
    return acc + BigInt(w.currentBalance || '0');
  }, 0n);

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ওয়ালেটটি মুছে ফেলতে চান?')) return;
    try {
      const res = await deleteWalletMutation.mutateAsync(id);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই খাতটি মুছে ফেলতে চান?')) return;
    try {
      const res = await deleteCategoryMutation.mutateAsync(id);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">হিসাবখাতা</p>
          <h1>অ্যাকাউন্ট ও খাত</h1>
          <p className="sub">
            সব অ্যাকাউন্টে মোট{' '}
            <b className="num">
              <Money amount={totalBalancePaisa} />
            </b>
          </p>
        </div>

        <div className="head-r" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '4px' }} />
            নতুন খাত
          </Button>
          <Button variant="primary" onClick={() => setIsWalletModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '4px' }} />
            নতুন অ্যাকাউন্ট
          </Button>
        </div>
      </header>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'wallets' ? 'primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('wallets')}
        >
          অ্যাকাউন্ট ও ওয়ালেট ({wallets.length})
        </button>
        <button
          className={`btn ${activeTab === 'categories' ? 'primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('categories')}
        >
          ক্যাটাগরি / খরচের খাত ({categories.length})
        </button>
      </div>

      {activeTab === 'wallets' ? (
        <div>
          {isLoadingWallets ? (
            <p style={{ color: 'var(--muted)', padding: '2rem 0' }}>ওয়ালেটের তথ্য লোড হচ্ছে...</p>
          ) : wallets.length === 0 ? (
            <div className="panel" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                এখনো কোনো অ্যাকাউন্ট বা ওয়ালেট যোগ করা হয়নি।
              </p>
              <Button onClick={() => setIsWalletModalOpen(true)}>প্রথম অ্যাকাউন্ট যোগ করুন</Button>
            </div>
          ) : (
            <div className="cards">
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onDelete={handleDeleteWallet}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {isLoadingCategories ? (
            <p style={{ color: 'var(--muted)', padding: '2rem 0' }}>খাতের তথ্য লোড হচ্ছে...</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <CategoryList
                title="খরচের খাতসমূহ"
                categories={expenseCategories}
                onDelete={handleDeleteCategory}
              />
              <CategoryList
                title="আয়ের খাতসমূহ"
                categories={incomeCategories}
                onDelete={handleDeleteCategory}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <WalletFormModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
