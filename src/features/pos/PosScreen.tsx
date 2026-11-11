import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import {
  getCustomer,
  getPriceFor,
  getProductUnits,
  getStoreProfile,
  listCategories,
  listCustomers,
  listProducts,
} from '../../lib/repo';
import { formatNumber, formatQty, roundTo } from '../../lib/format';
import { useCart, cartTotals } from '../../stores/cart';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { BottomSheet, EmptyState, HeroBanner, Money, NumberSheet } from '../../components/ui';
import { IconClock, IconMinus, IconPlus, IconSearch, IconStar, IconUser } from '../../components/icons';
import { t, useLang } from '../../lib/locale';
import type { ProductView } from '../../lib/types';
import CartSheet from './CartSheet';

export default function PosScreen() {
  const ver = useDbVersion();
  const nav = useNavigate();
  const user = useSession((s) => s.user);
  const cart = useCart();
  const store = getStoreProfile();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sheetProduct, setSheetProduct] = useState<ProductView | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const lang = useLang(); void lang;

  const categories = useMemo(() => listCategories(), [ver]);
  const products = useMemo(
    () => listProducts({ search, categoryId: category || undefined }),
    [search, category, ver],
  );
  const customers = useMemo(
    () => (customerSearch ? listCustomers(customerSearch) : listCustomers('').slice(0, 30)),
    [customerSearch, ver],
  );

  const tierId = useMemo(() => {
    if (!cart.customer_id) return 't-eceran';
    return getCustomer(cart.customer_id)?.price_tier_id ?? 't-eceran';
  }, [cart.customer_id, ver]);

  const totals = cartTotals(cart, store?.ppn_persen ?? 0, store?.pembulatan ?? 0);

  function priceOf(p: ProductView): number {
    const units = getProductUnits(p.id);
    const def = units.find((u) => u.is_default_jual) ?? units[0];
    if (!def) return 0;
    return getPriceFor(def.id, tierId);
  }

  return (
    <div className="screen">
      <div className="appbar">
        <div className="appbar-inner">
          <div className="grow">
            <div className="appbar-title">{store?.nama || 'Kokoh'}</div>
            <div className="appbar-sub">{user?.nama} · {t('pos.cashier')}</div>
          </div>
          <button className="btn btn-icon btn-ghost" style={{ color: '#fff' }} onClick={() => nav('/pos/history')} aria-label={t('tab.reports')}>
            <IconClock size={22} />
          </button>
        </div>
      </div>

      <div className="screen-body">
        <div className="page-tight" style={{ paddingBottom: cart.items.length ? 150 : 80 }}>
          <div style={{ padding: '12px 16px 0' }}>
            <div className="search-wrap">
              <IconSearch size={20} className="search-icon" />
              <input
                className="search-input"
                placeholder={t('pos.searchPh')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="row no-scrollbar" style={{ overflowX: 'auto', padding: '12px 16px', gap: 8 }}>
            <button className={'chip' + (category === '' ? ' active' : '')} onClick={() => setCategory('')}>
              {t('pos.all')}
            </button>
            {categories.map((c) => (
              <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(c.id)}>
                {c.nama}
              </button>
            ))}
          </div>

          {!search && !category ? (
            <div style={{ padding: '0 16px 12px' }}>
              <HeroBanner
                image="./assets/hero-banner.webp"
                title={t('pos.heroTitle')}
                subtitle={t('pos.heroSub')}
              />
            </div>
          ) : null}

          <div style={{ padding: '0 16px' }}>
            {products.length === 0 ? (
              <EmptyState title={t('pos.notFound')} message={t('pos.notFoundSub')} image="./assets/onboarding.webp" />
            ) : (
              <div className="product-grid">
                {products.map((p) => (
                  <div key={p.id} className={'product-card' + (p.stok_dasar <= 0 ? ' out' : '')} onClick={() => setSheetProduct(p)}>
                    {p.favorit ? (
                      <span className="tag-favorit" style={{ color: 'var(--accent-yellow)' }}>
                        <IconStar size={14} />
                      </span>
                    ) : null}
                    <div>
                      <div className="product-name">{p.nama}</div>
                      <div className="tiny faint mt-1">{p.sku || p.barcode || p.kategori_nama}</div>
                    </div>
                    <div>
                      <div className="money money-sm money-primary">{'Rp ' + formatNumber(priceOf(p))}</div>
                      <div className="tiny mt-1">
                        <span className={p.stok_dasar <= p.stok_min ? 'badge badge-danger' : 'badge badge-neutral'}>
                          {t('pos.stock')} {formatQty(p.stok_dasar)} {p.base_unit_simbol}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {cart.items.length > 0 ? (
        <div className="sticky-footer" style={{ bottom: 60 }}>
          <div className="row-between mb-2">
            <div className="row" style={{ gap: 8 }}>
              <span className="badge badge-primary">{cart.items.length} {t('pos.item')}</span>
              {cart.customer_nama ? (
                <span className="badge badge-info">
                  <IconUser size={12} /> {cart.customer_nama}
                </span>
              ) : null}
            </div>
            <Money value={totals.total} size="lg" />
          </div>
          <div className="row">
            <button className="btn btn-soft" onClick={() => setCartOpen(true)} style={{ minWidth: 110 }}>
              {t('pos.cart')}
            </button>
            <button className="btn btn-primary btn-lg grow" onClick={() => nav('/pos/payment')}>
              {t('pos.pay')}
            </button>
          </div>
        </div>
      ) : null}

      <ProductSheet
        product={sheetProduct}
        tierId={tierId}
        onClose={() => setSheetProduct(null)}
        onAdd={(payload) => {
          cart.add(payload);
          toast.success(t('pos.added'));
          setSheetProduct(null);
        }}
      />

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} onPay={() => {
        setCartOpen(false);
        nav('/pos/payment');
      }} onPickCustomer={() => {
        setCartOpen(false);
        setCustomerOpen(true);
      }} />

      <BottomSheet open={customerOpen} onClose={() => setCustomerOpen(false)} title={t('pos.chooseCustomer')}>
        <div className="search-wrap mb-3">
          <IconSearch size={18} className="search-icon" />
          <input className="search-input" placeholder={t('pos.searchCustomerPh')} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
        </div>
        <button
          className="btn btn-ghost btn-block mb-2"
          onClick={() => {
            cart.setCustomer(null, '');
            setCustomerOpen(false);
          }}
        >
          {t('common.generalCustomer')}
        </button>
        <div className="list">
          {customers.map((c) => (
            <div
              key={c.id}
              className="list-row clickable"
              onClick={() => {
                cart.setCustomer(c.id, c.nama);
                if (c.proyek) cart.setProyek(c.proyek);
                setCustomerOpen(false);
                toast.success(c.nama);
              }}
            >
              <div className="avatar">{c.nama.slice(0, 1).toUpperCase()}</div>
              <div className="grow">
                <div className="semibold truncate">{c.nama}</div>
                <div className="small muted">{c.telp || c.kode || t('common.customer')}</div>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

function ProductSheet({
  product,
  tierId,
  onClose,
  onAdd,
}: {
  product: ProductView | null;
  tierId: string;
  onClose: () => void;
  onAdd: (item: {
    key: string;
    product_id: string;
    product_unit_id: string;
    unit_id: string;
    unit_simbol: string;
    allow_decimal: number;
    decimal_places: number;
    konversi: number;
    nama_produk: string;
    sku: string;
    qty: number;
    harga_satuan: number;
    diskon: number;
    subtotal: number;
    stok_dasar: number;
    hpp: number;
  }) => void;
}) {
  const units = useMemo(() => (product ? getProductUnits(product.id) : []), [product]);
  const [unitIdx, setUnitIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [qtySheet, setQtySheet] = useState(false);
  const lang = useLang(); void lang;

  const activeUnit = units[unitIdx] ?? units[0];

  useEffect(() => {
    if (activeUnit) {
      setPrice(getPriceFor(activeUnit.id, tierId));
      setQty(1);
    }
  }, [activeUnit?.id, tierId]);

  if (!product || !activeUnit) return null;

  const qtyDasar = qty * activeUnit.konversi;
  const kurang = product.stok_dasar < qtyDasar;

  return (
    <BottomSheet
      open={!!product}
      onClose={onClose}
      title={product.nama}
      footer={
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() =>
            onAdd({
              key: activeUnit.id + '-' + Date.now(),
              product_id: product.id,
              product_unit_id: activeUnit.id,
              unit_id: activeUnit.unit_id,
              unit_simbol: activeUnit.unit_simbol,
              allow_decimal: activeUnit.allow_decimal,
              decimal_places: activeUnit.decimal_places,
              konversi: activeUnit.konversi,
              nama_produk: product.nama,
              sku: product.sku,
              qty,
              harga_satuan: price,
              diskon: 0,
              subtotal: Math.round(qty * price),
              stok_dasar: product.stok_dasar,
              hpp: product.hpp,
            })
          }
        >
          {t('pos.add')} · Rp {formatNumber(Math.round(qty * price))}
        </button>
      }
    >
      <div className="small muted mb-2">
        {t('pos.stock')}: {formatQty(product.stok_dasar)} {product.base_unit_simbol}
        {kurang ? <span className="badge badge-warning" style={{ marginLeft: 8 }}>{t('pos.lowStock')}</span> : null}
      </div>

      <div className="label mb-2">{t('pos.unit')}</div>
      <div className="row wrap mb-3" style={{ gap: 8 }}>
        {units.map((u, i) => (
          <button key={u.id} className={'chip' + (i === unitIdx ? ' active' : '')} onClick={() => setUnitIdx(i)}>
            {u.unit_simbol}
            {u.konversi !== 1 ? <span className="tiny"> ×{u.konversi}</span> : null}
          </button>
        ))}
      </div>

      <div className="label mb-1">{t('pos.qtyUnit', { unit: activeUnit.unit_simbol })}</div>
      <div className="row">
        <button className="qty-btn" onClick={() => setQty((q) => Math.max(activeUnit.allow_decimal ? 0.1 : 1, roundTo(q - (activeUnit.allow_decimal ? 0.5 : 1), 3)))}>
          <IconMinus size={16} />
        </button>
        <button className="qty-value grow" onClick={() => setQtySheet(true)}>
          {formatQty(qty)}
        </button>
        <button className="qty-btn" onClick={() => setQty((q) => roundTo(q + (activeUnit.allow_decimal ? 0.5 : 1), 3))}>
          <IconPlus size={16} />
        </button>
      </div>

      <div className="mt-3">
        <div className="label mb-1">{t('pos.unitPrice')}</div>
        <input
          className="input num"
          inputMode="numeric"
          value={formatNumber(price)}
          onChange={(e) => setPrice(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))}
        />
      </div>

      {activeUnit.konversi !== 1 ? (
        <div className="small muted mt-2">
          {t('pos.qtyEq', { qty: String(formatQty(qty)), unit: activeUnit.unit_simbol, base: String(formatQty(qtyDasar)), baseUnit: product.base_unit_simbol })}
        </div>
      ) : null}

      <NumberSheet
        open={qtySheet}
        title={t('pos.amount')}
        value={qty}
        allowDecimal={!!activeUnit.allow_decimal}
        onClose={() => setQtySheet(false)}
        onConfirm={(n) => {
          setQty(n > 0 ? roundTo(n, 3) : 1);
          setQtySheet(false);
        }}
      />
    </BottomSheet>
  );
}
