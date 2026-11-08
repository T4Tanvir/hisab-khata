import React, { useState } from 'react';
import { useWallets, useDeleteWallet, WalletCard, WalletFormModal } from '@/features/wallets';
import { useCategories, useDeleteCategory, CategoryList, CategoryFormModal } from '@/features/categories';
import { FamilySharingCard } from '@/features/family';
import { Money } from '@/components/Money';
import { useLanguage } from '@/hooks/useLanguage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wallet as WalletIcon, Layers, Users } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { data: wallets = [], isLoading: isLoadingWallets } = useWallets();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();

  const deleteWalletMutation = useDeleteWallet();
  const deleteCategoryMutation = useDeleteCategory();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallets' | 'categories' | 'family'>('wallets');
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'wallet' | 'category';
    id: string;
    name?: string;
  } | null>(null);

  // Compute total balance across all wallets
  const totalBalancePaisa = wallets.reduce((acc, w) => {
    return acc + BigInt(w.currentBalance || '0');
  }, 0n);

  const handleDeleteWallet = (id: string) => {
    const w = wallets.find((item) => item.id === id);
    setDeleteTarget({ type: 'wallet', id, name: w?.name });
  };

  const handleDeleteCategory = (id: string) => {
    const c = categories.find((item) => item.id === id);
    setDeleteTarget({ type: 'category', id, name: c?.name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'wallet') {
        await deleteWalletMutation.mutateAsync(deleteTarget.id);
      } else {
        await deleteCategoryMutation.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.accounts.title}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {t.nav.accounts}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === 'bn' ? 'সব অ্যাকাউন্টে মোট ' : 'Total across all accounts: '}
            <span className="font-bold text-foreground text-base">
              <Money amount={totalBalancePaisa} />
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t.accounts.newCategory}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsWalletModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t.accounts.newWallet}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
        <Button
          variant={activeTab === 'wallets' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('wallets')}
          className="gap-2"
        >
          <WalletIcon className="h-4 w-4" />
          {language === 'bn' ? 'অ্যাকাউন্ট ও ওয়ালেট' : 'Wallets & Accounts'} ({wallets.length})
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('categories')}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          {language === 'bn' ? 'ক্যাটাগরি / খরচের খাত' : 'Categories'} ({categories.length})
        </Button>
        <Button
          variant={activeTab === 'family' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('family')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {language === 'bn' ? 'পারিবারিক শেয়ারিং' : 'Family Sharing'}
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'wallets' ? (
        <div>
          {isLoadingWallets ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>ওয়ালেটের তথ্য লোড হচ্ছে...</p>
            </div>
          ) : wallets.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">কোনো অ্যাকাউন্ট নেই</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    লেনদেন শুরু করতে প্রথমে একটি অ্যাকাউন্ট বা ওয়ালেট যোগ করুন।
                  </p>
                </div>
                <Button onClick={() => setIsWalletModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> প্রথম অ্যাকাউন্ট যোগ করুন
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : activeTab === 'categories' ? (
        <div>
          {isLoadingCategories ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>খাতের তথ্য লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="space-y-6">
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
      ) : (
        <FamilySharingCard />
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

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteWalletMutation.isPending || deleteCategoryMutation.isPending}
        title={
          deleteTarget?.type === 'wallet'
            ? language === 'bn' ? `"${deleteTarget.name || 'ওয়ালেট'}" মুছে ফেলবেন?` : `Delete "${deleteTarget.name || 'Wallet'}"?`
            : language === 'bn' ? `"${deleteTarget?.name || 'খাত'}" মুছে ফেলবেন?` : `Delete "${deleteTarget?.name || 'Category'}"?`
        }
        description={
          deleteTarget?.type === 'wallet'
            ? language === 'bn'
              ? 'আপনি কি নিশ্চিত যে এই ওয়ালেটটি মুছে ফেলতে চান? এটিতে কোনো লেনদেন থাকলে ওয়ালেটটি আর্কাইভ হিসেবে সংরক্ষিত থাকবে।'
              : 'Are you sure you want to delete this wallet? If it has linked transactions, it will be safely archived.'
            : language === 'bn'
              ? 'আপনি কি নিশ্চিত যে এই খাতটি মুছে ফেলতে চান? পূর্ববর্তী লেনদেনের তথ্য অক্ষত থাকবে।'
              : 'Are you sure you want to delete this category? Previous transactions linked to it will remain intact.'
        }
        confirmText={language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={language === 'bn' ? 'বাতিল' : 'Cancel'}
      />
    </div>
  );
};
