import { useState } from 'react';
import { useStore } from '../store';
import SmartInput from '../components/SmartInput';
import {
  Home, ChevronRight, Package, Plus, Search, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, X, Calendar, ShoppingCart, FileText, Truck, Check,
  Eye, Trash2, Building2
} from 'lucide-react';
import type { StockItem, StockMovement, PurchaseOrder, PurchaseOrderItem, Invoice, InvoiceItem } from '../types';

type AlmTab = 'estoque' | 'pedidos' | 'notas' | 'fornecedores';

export default function Almoxarifado() {
  const store = useStore();
  const { stockItems, stockMovements, addStockItem, addStockMovement, currentUser,
    purchaseOrders, addPurchaseOrder, updatePurchaseOrder,
    invoices, addInvoice, suppliers, addSupplier } = store;

  const [tab, setTab] = useState<AlmTab>('estoque');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'expiring'>('all');

  // Modals
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMovement, setShowMovement] = useState<StockItem | null>(null);
  const [showNewPO, setShowNewPO] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showPODetail, setShowPODetail] = useState<PurchaseOrder | null>(null);
  const [showNewSupplier, setShowNewSupplier] = useState(false);

  // Stock item form
  const [iName, setIName] = useState(''); const [iCode, setICode] = useState('');
  const [iCat, setICat] = useState('Medicamentos'); const [iQty, setIQty] = useState('');
  const [iMin, setIMin] = useState(''); const [iUnit, setIUnit] = useState('');
  const [iLoc, setILoc] = useState(''); const [iExp, setIExp] = useState('');
  const [iCost, setICost] = useState(''); const [iSup, setISup] = useState('');

  // Movement form
  const [movType, setMovType] = useState<'entrada' | 'saida'>('entrada');
  const [movQty, setMovQty] = useState(''); const [movReason, setMovReason] = useState('');

  // Purchase Order form
  const [poSup, setPoSup] = useState(''); const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [poItemId, setPoItemId] = useState(''); const [poItemQty, setPoItemQty] = useState('');
  const [poItemCost, setPoItemCost] = useState('');

  // Invoice form
  const [invNum, setInvNum] = useState(''); const [invSeries, setInvSeries] = useState('');
  const [invPO, setInvPO] = useState(''); const [invDate, setInvDate] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [invItems, setInvItems] = useState<InvoiceItem[]>([]);
  const [invItemIdx, setInvItemIdx] = useState(''); const [invItemQty, setInvItemQty] = useState('');
  const [invItemBatch, setInvItemBatch] = useState(''); const [invItemExp, setInvItemExp] = useState('');

  // Supplier form
  const [supName, setSupName] = useState(''); const [supCnpj, setSupCnpj] = useState('');
  const [supPhone, setSupPhone] = useState(''); const [supEmail, setSupEmail] = useState('');
  const [supAddr, setSupAddr] = useState('');

  const filtered = stockItems.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'low') return i.quantity <= i.minQuantity;
    if (filter === 'expiring') return new Date(i.expiryDate).getTime() - Date.now() < 90 * 86400000;
    return true;
  });

  const handleAddItem = () => {
    if (!iName || !iCode) return;
    const item: StockItem = { id: `s${Date.now()}`, name: iName, code: iCode, category: iCat, quantity: parseInt(iQty) || 0, minQuantity: parseInt(iMin) || 0, unit: iUnit, location: iLoc, expiryDate: iExp, unitCost: parseFloat(iCost) || 0, supplierId: iSup, lastEntryDate: new Date().toISOString().split('T')[0] };
    addStockItem(item);
    setShowAddItem(false); setIName(''); setICode(''); setIQty(''); setIMin(''); setIUnit(''); setILoc(''); setIExp(''); setICost(''); setISup('');
  };

  const handleMovement = () => {
    if (!showMovement || !movQty) return;
    const mov: StockMovement = { id: `m${Date.now()}`, itemId: showMovement.id, type: movType, quantity: parseInt(movQty) || 0, reason: movReason, timestamp: new Date().toISOString(), userId: currentUser?.id || '', userName: currentUser?.name || '' };
    addStockMovement(mov);
    setShowMovement(null); setMovQty(''); setMovReason('');
  };

  const addPOItem = () => {
    const item = stockItems.find(i => i.id === poItemId);
    if (!item || !poItemQty) return;
    setPoItems([...poItems, { id: `poi${Date.now()}`, stockItemId: item.id, stockItemName: item.name, stockItemCode: item.code, quantity: parseInt(poItemQty) || 0, unitCost: parseFloat(poItemCost) || item.unitCost, receivedQuantity: 0 }]);
    setPoItemId(''); setPoItemQty(''); setPoItemCost('');
  };

  const createPO = () => {
    if (!poSup || poItems.length === 0) return;
    const sup = suppliers.find(s => s.id === poSup);
    const total = poItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const po: PurchaseOrder = { id: `po${Date.now()}`, number: `PC-2026-${String(purchaseOrders.length + 1).padStart(4, '0')}`, supplierId: poSup, supplierName: sup?.name || '', status: 'AGUARDANDO_APROVACAO', items: poItems, requestedBy: currentUser?.id || '', requestedByName: currentUser?.name || '', approvedBy: null, approvedByName: null, createdAt: new Date().toISOString(), approvedAt: null, notes: poNotes, totalValue: total };
    addPurchaseOrder(po);
    setShowNewPO(false); setPoSup(''); setPoNotes(''); setPoItems([]);
  };

  const approvePO = (po: PurchaseOrder) => {
    updatePurchaseOrder({ ...po, status: 'APROVADO', approvedBy: currentUser?.id || '', approvedByName: currentUser?.name || '', approvedAt: new Date().toISOString() });
    setShowPODetail(null);
  };

  const approvedPOs = purchaseOrders.filter(p => p.status === 'APROVADO' || p.status === 'RECEBIDO_PARCIAL');
  const selectedPO = invPO ? purchaseOrders.find(p => p.id === invPO) : null;

  const addInvItem = () => {
    if (!selectedPO || !invItemIdx) return;
    const poItem = selectedPO.items[parseInt(invItemIdx)];
    if (!poItem) return;
    const qty = parseInt(invItemQty) || 0;
    const cost = poItem.unitCost;
    setInvItems([...invItems, { id: `ii${Date.now()}`, stockItemId: poItem.stockItemId, stockItemName: poItem.stockItemName, stockItemCode: poItem.stockItemCode, quantity: qty, unitCost: cost, totalCost: qty * cost, batch: invItemBatch, expiryDate: invItemExp }]);
    setInvItemIdx(''); setInvItemQty(''); setInvItemBatch(''); setInvItemExp('');
  };

  const createInvoice = () => {
    if (!invNum || !invPO || !selectedPO || invItems.length === 0) return;
    const total = invItems.reduce((s, i) => s + i.totalCost, 0);
    const inv: Invoice = { id: `inv${Date.now()}`, number: invNum, series: invSeries, supplierId: selectedPO.supplierId, supplierName: selectedPO.supplierName, purchaseOrderId: selectedPO.id, purchaseOrderNumber: selectedPO.number, issueDate: invDate, entryDate: new Date().toISOString().split('T')[0], items: invItems, totalValue: total, status: 'ENTRADA_REALIZADA', receivedBy: currentUser?.id || '', receivedByName: currentUser?.name || '', notes: invNotes };
    addInvoice(inv);
    // Update stock
    invItems.forEach(ii => {
      addStockMovement({ id: `m${Date.now()}${ii.id}`, itemId: ii.stockItemId, type: 'entrada', quantity: ii.quantity, reason: `NF ${invNum} - PC ${selectedPO.number}`, timestamp: new Date().toISOString(), userId: currentUser?.id || '', userName: currentUser?.name || '', invoiceId: inv.id, purchaseOrderId: selectedPO.id, batch: ii.batch });
    });
    // Update PO received quantities
    const updatedItems = selectedPO.items.map(poi => {
      const received = invItems.filter(ii => ii.stockItemId === poi.stockItemId).reduce((s, ii) => s + ii.quantity, 0);
      return { ...poi, receivedQuantity: poi.receivedQuantity + received };
    });
    const allReceived = updatedItems.every(i => i.receivedQuantity >= i.quantity);
    updatePurchaseOrder({ ...selectedPO, items: updatedItems, status: allReceived ? 'RECEBIDO_TOTAL' : 'RECEBIDO_PARCIAL' });
    setShowNewInvoice(false); setInvNum(''); setInvSeries(''); setInvPO(''); setInvDate(''); setInvNotes(''); setInvItems([]);
  };

  const handleAddSupplier = () => {
    if (!supName || !supCnpj) return;
    addSupplier({ id: `sup${Date.now()}`, name: supName, cnpj: supCnpj, phone: supPhone, email: supEmail, address: supAddr });
    setShowNewSupplier(false); setSupName(''); setSupCnpj(''); setSupPhone(''); setSupEmail(''); setSupAddr('');
  };

  const tabs: { key: AlmTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'estoque', label: 'Estoque', icon: <Package className="w-4 h-4" /> },
    { key: 'pedidos', label: 'Pedidos de Compra', icon: <ShoppingCart className="w-4 h-4" />, count: purchaseOrders.filter(p => p.status === 'AGUARDANDO_APROVACAO').length },
    { key: 'notas', label: 'Notas Fiscais', icon: <FileText className="w-4 h-4" /> },
    { key: 'fornecedores', label: 'Fornecedores', icon: <Building2 className="w-4 h-4" /> },
  ];

  const Modal = ({ title, icon, color, onClose, children }: { title: string; icon: React.ReactNode; color: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-5 ${color} text-white rounded-t-2xl`}>
          <div className="flex items-center gap-3">{icon}<h3 className="font-bold text-sm">{title}</h3></div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Home className="w-3.5 h-3.5" /><ChevronRight className="w-3 h-3" /><span className="text-slate-700 font-semibold">Almoxarifado</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-amber-600" /></div>
        <div><h1 className="text-xl font-bold text-slate-900">Almoxarifado</h1><p className="text-xs text-slate-500">Gestão de estoque, compras e notas fiscais</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.icon}{t.label}
            {t.count ? <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {/* ========== ESTOQUE TAB ========== */}
      {tab === 'estoque' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou código..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex gap-1.5">
              {[{ k: 'all' as const, l: 'Todos' }, { k: 'low' as const, l: '⚠ Baixo' }, { k: 'expiring' as const, l: '⏰ Vencendo' }].map(f => (
                <button key={f.k} onClick={() => setFilter(f.k)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${filter === f.k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{f.l}</button>
              ))}
            </div>
            <button onClick={() => setShowAddItem(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20"><Plus className="w-3.5 h-3.5" /> Novo Item</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Código', 'Item', 'Categoria', 'Estoque', 'Mín', 'Custo Unit.', 'Local', 'Validade', ''].map(h => (
                    <th key={h} className={`${h === '' ? 'text-right' : 'text-left'} px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const low = item.quantity <= item.minQuantity;
                  const exp = new Date(item.expiryDate).getTime() - Date.now() < 90 * 86400000;
                  return (
                    <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${low ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800">{item.name}</p><p className="text-[10px] text-slate-400">{item.unit}</p></td>
                      <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{item.category}</span></td>
                      <td className="px-4 py-3"><span className={`font-bold text-base ${low ? 'text-red-600' : 'text-slate-800'}`}>{item.quantity}</span>{low && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline ml-1" />}</td>
                      <td className="px-4 py-3 text-slate-500">{item.minQuantity}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">R$ {item.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{item.location}</td>
                      <td className="px-4 py-3"><span className={`text-xs flex items-center gap-1 ${exp ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>{exp && <Calendar className="w-3 h-3" />}{new Date(item.expiryDate).toLocaleDateString('pt-BR')}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => { setShowMovement(item); setMovType('entrada'); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition" title="Entrada"><ArrowUpCircle className="w-4 h-4" /></button>
                          <button onClick={() => { setShowMovement(item); setMovType('saida'); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition" title="Saída"><ArrowDownCircle className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {stockMovements.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-bold text-sm text-slate-900">Movimentações Recentes</h3></div>
              <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                {stockMovements.slice(-10).reverse().map(m => {
                  const item = stockItems.find(i => i.id === m.itemId);
                  return (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {m.type === 'entrada' ? <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                        <span className="font-medium text-slate-700">{item?.name || '—'}</span>
                        <span className={`font-bold ${m.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>{m.type === 'entrada' ? '+' : '-'}{m.quantity}</span>
                        {m.reason && <span className="text-slate-400 text-xs">• {m.reason}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(m.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== PEDIDOS TAB ========== */}
      {tab === 'pedidos' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowNewPO(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"><ShoppingCart className="w-4 h-4" /> Novo Pedido</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {['Número', 'Fornecedor', 'Itens', 'Valor Total', 'Solicitante', 'Status', 'Data', ''].map(h => (
                  <th key={h} className={`${h === '' ? 'text-right' : 'text-left'} px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400">Nenhum pedido de compra</td></tr>
                ) : purchaseOrders.map(po => {
                  const stMap: Record<string, { l: string; c: string }> = {
                    RASCUNHO: { l: 'Rascunho', c: 'bg-slate-100 text-slate-600' },
                    AGUARDANDO_APROVACAO: { l: 'Ag. Aprovação', c: 'bg-amber-50 text-amber-700 border-amber-200' },
                    APROVADO: { l: 'Aprovado', c: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    RECEBIDO_PARCIAL: { l: 'Receb. Parcial', c: 'bg-blue-50 text-blue-700 border-blue-200' },
                    RECEBIDO_TOTAL: { l: 'Receb. Total', c: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    CANCELADO: { l: 'Cancelado', c: 'bg-red-50 text-red-600 border-red-200' },
                  };
                  const st = stMap[po.status] || stMap.RASCUNHO;
                  return (
                    <tr key={po.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{po.number}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{po.supplierName}</td>
                      <td className="px-4 py-3 text-slate-600">{po.items.length} item(s)</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">R$ {po.totalValue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{po.requestedByName}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${st.c}`}>{st.l}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(po.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setShowPODetail(po)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"><Eye className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========== NOTAS FISCAIS TAB ========== */}
      {tab === 'notas' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{approvedPOs.length} pedido(s) aprovado(s) disponíveis para entrada de NF</p>
            <button onClick={() => { if (approvedPOs.length === 0) { alert('Não há pedidos de compra aprovados para vincular. Crie e aprove um pedido primeiro.'); return; } setShowNewInvoice(true); }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"><FileText className="w-4 h-4" /> Entrada de NF</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {['NF', 'Série', 'Fornecedor', 'Pedido', 'Itens', 'Valor', 'Recebido por', 'Data', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-sm">Nenhuma nota fiscal registrada</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{inv.number}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.series}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.supplierName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{inv.purchaseOrderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.items.length}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">R$ {inv.totalValue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.receivedByName}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{inv.entryDate}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Entrada OK</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========== FORNECEDORES TAB ========== */}
      {tab === 'fornecedores' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowNewSupplier(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"><Building2 className="w-4 h-4" /> Novo Fornecedor</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                  <div className="min-w-0"><p className="font-bold text-sm text-slate-800 truncate">{s.name}</p><p className="text-[10px] text-slate-400 font-mono">{s.cnpj}</p></div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  {s.phone && <p>📞 {s.phone}</p>}
                  {s.email && <p>✉️ {s.email}</p>}
                  {s.address && <p className="truncate">📍 {s.address}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== MODALS ========== */}

      {showAddItem && (
        <Modal title="Novo Item de Estoque" icon={<Package className="w-5 h-5" />} color="bg-gradient-to-r from-blue-600 to-blue-700" onClose={() => setShowAddItem(false)}>
          <div className="grid grid-cols-2 gap-3">
            <SmartInput routineCode="ALM01" fieldName="itemName" value={iName} onChange={setIName} label="Nome" placeholder="Nome do item" />
            <SmartInput routineCode="ALM01" fieldName="itemCode" value={iCode} onChange={setICode} label="Código" placeholder="MED-0001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Categoria</label>
              <select value={iCat} onChange={e => setICat(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
                <option>Medicamentos</option><option>Soluções</option><option>Materiais</option><option>Equipamentos</option>
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Unidade</label>
              <input value={iUnit} onChange={e => setIUnit(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="comp, ml, un" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SmartInput routineCode="ALM01" fieldName="quantity" value={iQty} onChange={setIQty} label="Qtd Inicial" type="number" placeholder="0" />
            <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Qtd Mínima</label>
              <input type="number" value={iMin} onChange={e => setIMin(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="0" />
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Custo Unit.</label>
              <input type="number" step="0.01" value={iCost} onChange={e => setICost(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Local</label><input value={iLoc} onChange={e => setILoc(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Estante A-01" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Validade</label><input type="date" value={iExp} onChange={e => setIExp(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Fornecedor</label>
            <select value={iSup} onChange={e => setISup(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Selecione...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={handleAddItem} disabled={!iName || !iCode} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 disabled:from-slate-300 disabled:to-slate-300 text-white py-2.5 rounded-xl font-semibold text-sm">Adicionar Item</button>
        </Modal>
      )}

      {showMovement && (
        <Modal title={`${movType === 'entrada' ? 'Entrada' : 'Saída'} — ${showMovement.name}`} icon={movType === 'entrada' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />} color={movType === 'entrada' ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gradient-to-r from-red-600 to-rose-600'} onClose={() => setShowMovement(null)}>
          <div className="bg-slate-50 p-4 rounded-xl text-center"><p className="text-xs text-slate-500">Estoque Atual</p><p className="text-3xl font-bold text-slate-900 mt-1">{showMovement.quantity} <span className="text-sm font-normal text-slate-400">{showMovement.unit}</span></p></div>
          <div className="flex gap-2">
            <button onClick={() => setMovType('entrada')} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${movType === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>↑ Entrada</button>
            <button onClick={() => setMovType('saida')} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${movType === 'saida' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>↓ Saída</button>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Quantidade *</label><input type="number" value={movQty} onChange={e => setMovQty(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" min="1" autoFocus /></div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Motivo</label><input value={movReason} onChange={e => setMovReason(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Dispensação, reposição, ajuste..." /></div>
          <button onClick={handleMovement} disabled={!movQty} className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white disabled:bg-slate-300 ${movType === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>Confirmar {movType === 'entrada' ? 'Entrada' : 'Saída'}</button>
        </Modal>
      )}

      {showNewPO && (
        <Modal title="Novo Pedido de Compra" icon={<ShoppingCart className="w-5 h-5" />} color="bg-gradient-to-r from-blue-600 to-indigo-600" onClose={() => setShowNewPO(false)}>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Fornecedor *</label>
            <select value={poSup} onChange={e => setPoSup(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"><option value="">Selecione...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Observações</label>
            <textarea value={poNotes} onChange={e => setPoNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-h-[60px]" placeholder="Justificativa, urgência..." />
          </div>
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase">Adicionar Itens</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={poItemId} onChange={e => { setPoItemId(e.target.value); const item = stockItems.find(i => i.id === e.target.value); if (item) setPoItemCost(String(item.unitCost)); }}
                className="col-span-3 border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="">Item de estoque...</option>{stockItems.map(i => <option key={i.id} value={i.id}>{i.code} — {i.name}</option>)}</select>
              <input type="number" value={poItemQty} onChange={e => setPoItemQty(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Qtd" />
              <input type="number" step="0.01" value={poItemCost} onChange={e => setPoItemCost(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Custo un." />
              <button onClick={addPOItem} disabled={!poItemId || !poItemQty} className="bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold"><Plus className="w-4 h-4 mx-auto" /></button>
            </div>
            {poItems.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {poItems.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg text-xs">
                    <div><span className="font-semibold">{p.stockItemName}</span><span className="text-slate-400 ml-2">{p.quantity}x R${p.unitCost.toFixed(2)}</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold">R$ {(p.quantity * p.unitCost).toFixed(2)}</span><button onClick={() => setPoItems(poItems.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ))}
                <div className="text-right font-bold text-sm text-slate-800 pt-2 border-t">Total: R$ {poItems.reduce((s, i) => s + i.quantity * i.unitCost, 0).toFixed(2)}</div>
              </div>
            )}
          </div>
          <button onClick={createPO} disabled={!poSup || poItems.length === 0} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 text-white py-2.5 rounded-xl font-semibold text-sm">Criar Pedido (Ag. Aprovação)</button>
        </Modal>
      )}

      {showPODetail && (
        <Modal title={`Pedido ${showPODetail.number}`} icon={<ShoppingCart className="w-5 h-5" />} color="bg-gradient-to-r from-slate-700 to-slate-800" onClose={() => setShowPODetail(null)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] text-slate-500 uppercase font-bold">Fornecedor</p><p className="font-semibold text-sm mt-0.5">{showPODetail.supplierName}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] text-slate-500 uppercase font-bold">Status</p><p className="font-semibold text-sm mt-0.5 capitalize">{showPODetail.status.replace(/_/g, ' ').toLowerCase()}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] text-slate-500 uppercase font-bold">Solicitante</p><p className="font-semibold text-sm mt-0.5">{showPODetail.requestedByName}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] text-slate-500 uppercase font-bold">Data</p><p className="font-semibold text-sm mt-0.5">{new Date(showPODetail.createdAt).toLocaleDateString('pt-BR')}</p></div>
          </div>
          {showPODetail.approvedByName && (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200"><p className="text-[10px] text-emerald-600 uppercase font-bold">Aprovado por</p><p className="font-semibold text-sm text-emerald-800">{showPODetail.approvedByName} em {showPODetail.approvedAt ? new Date(showPODetail.approvedAt).toLocaleDateString('pt-BR') : '—'}</p></div>
          )}
          {showPODetail.notes && <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] text-slate-500 uppercase font-bold">Observações</p><p className="text-sm mt-0.5">{showPODetail.notes}</p></div>}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50"><th className="text-left px-3 py-2">Item</th><th className="text-center px-3 py-2">Qtd</th><th className="text-center px-3 py-2">Recebido</th><th className="text-right px-3 py-2">Subtotal</th></tr></thead>
              <tbody>{showPODetail.items.map(i => (
                <tr key={i.id} className="border-t"><td className="px-3 py-2 font-medium">{i.stockItemName}</td><td className="px-3 py-2 text-center">{i.quantity}</td><td className="px-3 py-2 text-center">{i.receivedQuantity}</td><td className="px-3 py-2 text-right font-mono">R$ {(i.quantity * i.unitCost).toFixed(2)}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="text-right font-bold text-sm">Total: R$ {showPODetail.totalValue.toFixed(2)}</div>
          {showPODetail.status === 'AGUARDANDO_APROVACAO' && currentUser?.role === 'admin' && (
            <button onClick={() => approvePO(showPODetail)} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Aprovar Pedido</button>
          )}
        </Modal>
      )}

      {showNewInvoice && (
        <Modal title="Entrada de Nota Fiscal" icon={<Truck className="w-5 h-5" />} color="bg-gradient-to-r from-emerald-600 to-green-600" onClose={() => setShowNewInvoice(false)}>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />A entrada de NF só é permitida mediante um Pedido de Compra aprovado.</div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Pedido de Compra Vinculado *</label>
            <select value={invPO} onChange={e => setInvPO(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Selecione o pedido...</option>{approvedPOs.map(p => <option key={p.id} value={p.id}>{p.number} — {p.supplierName} (R$ {p.totalValue.toFixed(2)})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SmartInput routineCode="ALM03" fieldName="invoiceNumber" value={invNum} onChange={setInvNum} label="Nº da NF" placeholder="000123" />
            <SmartInput routineCode="ALM03" fieldName="series" value={invSeries} onChange={setInvSeries} label="Série" placeholder="001" />
            <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Data Emissão</label><input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" /></div>
          </div>
          {selectedPO && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase">Itens do Pedido {selectedPO.number}</p>
              <div className="space-y-2">
                <select value={invItemIdx} onChange={e => setInvItemIdx(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Selecione o item...</option>
                  {selectedPO.items.map((it, idx) => <option key={it.id} value={idx}>{it.stockItemCode} — {it.stockItemName} (Qtd: {it.quantity}, Receb: {it.receivedQuantity})</option>)}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={invItemQty} onChange={e => setInvItemQty(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Qtd recebida" />
                  <input value={invItemBatch} onChange={e => setInvItemBatch(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Lote" />
                  <input type="date" value={invItemExp} onChange={e => setInvItemExp(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" title="Validade" />
                </div>
                <button onClick={addInvItem} disabled={!invItemIdx || !invItemQty} className="w-full bg-slate-900 disabled:bg-slate-300 text-white py-2 rounded-lg text-xs font-semibold"><Plus className="w-3.5 h-3.5 inline mr-1" />Adicionar</button>
              </div>
              {invItems.length > 0 && (
                <div className="space-y-1.5 mt-2 pt-2 border-t">
                  {invItems.map((ii, i) => (
                    <div key={ii.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg text-xs">
                      <div><span className="font-semibold">{ii.stockItemName}</span><span className="text-slate-400 ml-2">{ii.quantity}x • Lote: {ii.batch || '—'}</span></div>
                      <div className="flex items-center gap-2"><span className="font-bold">R$ {ii.totalCost.toFixed(2)}</span><button onClick={() => setInvItems(invItems.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
                    </div>
                  ))}
                  <div className="text-right font-bold text-sm pt-2 border-t">Total NF: R$ {invItems.reduce((s, i) => s + i.totalCost, 0).toFixed(2)}</div>
                </div>
              )}
            </div>
          )}
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Observações</label>
            <textarea value={invNotes} onChange={e => setInvNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm min-h-[50px]" placeholder="Conferência, divergências..." />
          </div>
          <button onClick={createInvoice} disabled={!invNum || !invPO || invItems.length === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 disabled:from-slate-300 disabled:to-slate-300 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Confirmar Entrada de NF</button>
        </Modal>
      )}

      {showNewSupplier && (
        <Modal title="Novo Fornecedor" icon={<Building2 className="w-5 h-5" />} color="bg-gradient-to-r from-blue-600 to-blue-700" onClose={() => setShowNewSupplier(false)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Razão Social *</label><input value={supName} onChange={e => setSupName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Nome da empresa" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">CNPJ *</label><input value={supCnpj} onChange={e => setSupCnpj(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" placeholder="00.000.000/0001-00" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Telefone</label><input value={supPhone} onChange={e => setSupPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Email</label><input value={supEmail} onChange={e => setSupEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Endereço</label><input value={supAddr} onChange={e => setSupAddr(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" /></div>
          </div>
          <button onClick={handleAddSupplier} disabled={!supName || !supCnpj} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 disabled:from-slate-300 disabled:to-slate-300 text-white py-2.5 rounded-xl font-semibold text-sm">Cadastrar Fornecedor</button>
        </Modal>
      )}
    </div>
  );
}
