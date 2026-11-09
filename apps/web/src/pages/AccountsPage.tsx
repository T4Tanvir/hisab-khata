import React, { useState } from 'react';
import { useWallets, useDeleteWallet, WalletCard, WalletFormModal } from '@/features/wallets';
import { useCategories, useDeleteCategory, CategoryList, CategoryFormModal } from '@/features/categories';
import { FamilySharingCard } from '@/features/family';
import { Money } from '@/components/Money';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wallet as WalletIcon, Layers, Users } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
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

  // Failures are shown inside the ConfirmationModal (no blocking alert)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'wallet') {
      await deleteWalletMutation.mutateAsync(deleteTarget.id);
    } else {
      await deleteCategoryMutation.mutateAsync(deleteTarget.id);
    }
    setDeleteTarget(null);
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
            {t.accounts.totalAcross}
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
          {t.accounts.walletsTabLabel} ({formatNumber(wallets.length)})
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('categories')}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          {t.accounts.categoriesTabLabel} ({formatNumber(categories.length)})
        </Button>
        <Button
          variant={activeTab === 'family' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('family')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {t.accounts.familyTab}
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'wallets' ? (
        <div>
          {isLoadingWallets ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>{t.accounts.walletsLoading}</p>
            </div>
          ) : wallets.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{t.accounts.noWallets}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.accounts.noWalletsHint}
                  </p>
                </div>
                <Button onClick={() => setIsWalletModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> {t.accounts.firstWallet}
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
              <p>{t.accounts.categoriesLoading}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <CategoryList
                title={t.accounts.expenseCategories}
                categories={expenseCategories}
                onDelete={handleDeleteCategory}
              />
              <CategoryList
                title={t.accounts.incomeCategories}
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
        title={interpolate(t.accounts.deleteTitle, {
          name:
            deleteTarget?.name ||
            (deleteTarget?.type === 'wallet' ? t.accounts.walletFallback : t.accounts.categoryFallback),
        })}
        description={
          deleteTarget?.type === 'wallet'
            ? t.accounts.deleteWalletMessage
            : t.accounts.deleteCategoryMessage
        }
        confirmText={t.common.yesDelete}
        cancelText={t.common.cancel}
      />
    </div>
  );
};
