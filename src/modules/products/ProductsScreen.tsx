import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import { tokens } from '@/theme';

import type { ProductDto } from './products.service';
import { useProducts } from './useProducts';

type ProductFilter = 'all' | 'active' | 'inactive';

export function ProductsScreen() {
  const money = useCurrency();
  const { t } = useI18n();
  const productsQuery = useProducts();
  const products = productsQuery.data ?? [];
  const [filter, setFilter] = useState<ProductFilter>('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (filter === 'active') {
      return products.filter((product) => product.isActive);
    }
    if (filter === 'inactive') {
      return products.filter((product) => !product.isActive);
    }
    return products;
  }, [filter, products]);

  const selectedProduct = useMemo(() => {
    if (filteredProducts.length === 0) {
      return null;
    }

    return filteredProducts.find((product) => product.id === selectedProductId) ?? filteredProducts[0];
  }, [filteredProducts, selectedProductId]);

  const categoriesCount = useMemo(() => {
    const categories = products.map((product) => product.category).filter(Boolean);
    return new Set(categories).size;
  }, [products]);

  return (
    <AppScreen>
      <View style={styles.root}>
        <View style={styles.catalog}>
          <ProductCatalogHeader
            activeCount={products.filter((product) => product.isActive).length}
            categoriesCount={categoriesCount}
            totalCount={products.length}
          />

          <View style={styles.filterRow}>
            <FilterChip label={t('products.filters.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterChip label={t('products.filters.active')} selected={filter === 'active'} onPress={() => setFilter('active')} />
            <FilterChip label={t('products.filters.inactive')} selected={filter === 'inactive'} onPress={() => setFilter('inactive')} />
          </View>

          <ScrollView contentContainerStyle={styles.productGrid} showsVerticalScrollIndicator={false}>
            {productsQuery.isLoading ? (
              <Surface style={styles.emptyCatalog}>
                <EmptyState title={t('products.empty.title')} description={t('products.empty.description')} />
              </Surface>
            ) : filteredProducts.length === 0 ? (
              <Surface style={styles.emptyCatalog}>
                <EmptyState title={t('products.empty.title')} description={t('products.empty.description')} />
              </Surface>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  money={money}
                  onPress={() => setSelectedProductId(product.id)}
                  product={product}
                  selected={selectedProduct?.id === product.id}
                />
              ))
            )}
          </ScrollView>
        </View>

        <ProductDetailPanel money={money} product={selectedProduct} />
      </View>
    </AppScreen>
  );
}

function ProductCatalogHeader({ activeCount, categoriesCount, totalCount }: { activeCount: number; categoriesCount: number; totalCount: number }) {
  const { t } = useI18n();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>{t('products.eyebrow')}</Text>
        <Text style={styles.title}>{t('products.title')}</Text>
      </View>
      <View style={styles.metrics}>
        <MetricCard label={t('products.metrics.total')} value={String(totalCount)} tone="accent" />
        <MetricCard label={t('products.metrics.active')} value={String(activeCount)} />
        <MetricCard label={t('products.metrics.categories')} value={String(categoriesCount)} />
      </View>
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable android_ripple={{ color: tokens.colors.accentMuted }} onPress={onPress} style={[styles.filterChip, selected && styles.filterChipSelected]}>
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function ProductCard({
  money,
  onPress,
  product,
  selected,
}: {
  money: (value: number) => string;
  onPress: () => void;
  product: ProductDto;
  selected: boolean;
}) {
  const { t } = useI18n();
  const modifierGroupCount = product.modifierGroups.length;

  return (
    <Pressable android_ripple={{ color: tokens.colors.accentMuted }} onPress={onPress} style={[styles.productCard, selected && styles.productCardSelected]}>
      <View>
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.productCategory}>
          {product.category ?? t('sell.category.menu')}
        </Text>
        {modifierGroupCount > 0 ? (
          <Text numberOfLines={1} style={styles.productModifierHint}>
            {t('modifier.groups', { count: modifierGroupCount })}
          </Text>
        ) : null}
      </View>
      <View style={styles.productFooter}>
        <ProductStatusPill isActive={product.isActive} />
        <Text style={styles.productPrice}>{money(Number(product.price))}</Text>
      </View>
    </Pressable>
  );
}

function ProductStatusPill({ isActive }: { isActive: boolean }) {
  const { t } = useI18n();

  return (
    <StatusPill
      value={isActive ? t('products.status.active') : t('products.status.inactive')}
      tone={isActive ? 'success' : 'neutral'}
    />
  );
}

function ProductDetailPanel({ money, product }: { money: (value: number) => string; product: ProductDto | null }) {
  const { t } = useI18n();
  const modifierGroupCount = product?.modifierGroups.length ?? 0;

  return (
    <Surface variant="elevated" shadow="soft" style={styles.detailPanel}>
      <Text style={styles.detailEyebrow}>{t('products.detail.title')}</Text>
      {product ? (
        <View style={styles.detailContent}>
          <View>
            <Text numberOfLines={3} style={styles.detailName}>
              {product.name}
            </Text>
            <Text style={styles.detailCategory}>{product.category ?? t('sell.category.menu')}</Text>
            {modifierGroupCount > 0 ? (
              <Text style={styles.detailModifierHint}>{t('modifier.groups', { count: modifierGroupCount })}</Text>
            ) : null}
          </View>

          <View style={styles.detailPriceBlock}>
            <Text style={styles.detailPrice}>{money(Number(product.price))}</Text>
            <ProductStatusPill isActive={product.isActive} />
          </View>

          <View style={styles.detailDivider} />

          <EmptyState title={t('products.detail.emptyTitle')} description={t('products.detail.emptyDescription')} />
        </View>
      ) : (
        <View style={styles.detailEmpty}>
          <EmptyState title={t('products.empty.title')} description={t('products.empty.description')} />
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    gap: tokens.navigation.workspaceGap,
  },
  catalog: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  eyebrow: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...tokens.typography.display,
    color: tokens.colors.ink,
    marginTop: tokens.spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
  },
  filterChip: {
    minHeight: tokens.spacing.touchTargetMin,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  filterChipSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.surfaceElevated,
  },
  filterText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  filterTextSelected: {
    color: tokens.colors.accent,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing['2xl'],
  },
  productCard: {
    width: 172,
    minHeight: 150,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    ...tokens.shadow.soft,
  },
  productCardSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.surfaceElevated,
  },
  productName: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  productCategory: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.xs,
  },
  productModifierHint: {
    ...tokens.typography.caption,
    color: tokens.colors.accent,
    marginTop: tokens.spacing.xs,
  },
  productFooter: {
    gap: tokens.spacing.sm,
  },
  productPrice: {
    ...tokens.typography.numeric,
    color: tokens.colors.ink,
  },
  emptyCatalog: {
    flex: 1,
    minWidth: 460,
  },
  detailPanel: {
    width: 340,
    alignSelf: 'stretch',
  },
  detailEyebrow: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    textTransform: 'uppercase',
  },
  detailContent: {
    flex: 1,
    gap: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
  },
  detailName: {
    ...tokens.typography.screenTitle,
    color: tokens.colors.ink,
  },
  detailCategory: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.sm,
  },
  detailModifierHint: {
    ...tokens.typography.caption,
    color: tokens.colors.accent,
    marginTop: tokens.spacing.sm,
  },
  detailPriceBlock: {
    gap: tokens.spacing.md,
  },
  detailPrice: {
    ...tokens.typography.numericLarge,
    color: tokens.colors.ink,
  },
  detailDivider: {
    height: 1,
    backgroundColor: tokens.colors.line,
  },
  detailEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
});
