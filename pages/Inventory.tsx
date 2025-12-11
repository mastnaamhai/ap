
import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { Product, CATEGORIES, GST_RATES } from '../types';
import { Plus, Search, Trash2, Edit2, Package, X } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await db.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      brand: formData.get('brand') as string,
      batchNumber: formData.get('batchNumber') as string,
      expiryDate: formData.get('expiryDate') as string,
      packSize: formData.get('packSize') as string,
      hsnCode: formData.get('hsnCode') as string,
      rate: parseFloat(formData.get('rate') as string),
      gstRate: parseFloat(formData.get('gstRate') as string),
      stock: parseInt(formData.get('stock') as string) || 0,
      minStock: parseInt(formData.get('minStock') as string) || 0,
    };

    try {
      await db.saveProduct(newProduct);
      const updatedProducts = await db.getProducts();
      setProducts(updatedProducts);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await db.deleteProduct(id);
        const updatedProducts = await db.getProducts();
        setProducts(updatedProducts);
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Product Catalog</h2>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search medicine, batch number..." 
            className="bg-transparent border-none outline-none text-base sm:text-sm w-full h-10 sm:h-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Product Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Batch / Exp</th>
                <th className="px-4 py-3 whitespace-nowrap">Pack Size</th>
                <th className="px-4 py-3 whitespace-nowrap">Stock</th>
                <th className="px-4 py-3 whitespace-nowrap">Rate</th>
                <th className="px-4 py-3 whitespace-nowrap">GST</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="font-medium text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.brand} • {product.category}</div>
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="text-slate-700">{product.batchNumber}</div>
                    <div className={`text-xs ${new Date(product.expiryDate) < new Date() ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                      Exp: {product.expiryDate}
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[100px]">
                    <span className="text-slate-600">{product.packSize}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-bold ${product.stock <= product.minStock ? 'text-red-500' : 'text-green-600'}`}>
                      {product.stock}
                    </div>
                    <div className="text-[10px] text-slate-400">Min: {product.minStock}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">₹{product.rate}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{product.gstRate}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-primary bg-slate-100 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-500 hover:text-red-500 bg-slate-100 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No products found. Add items to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 fade-in duration-300">
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 sm:p-6 border-b">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Product Name *</label>
                <input name="name" defaultValue={editingProduct?.name} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Brand</label>
                <input name="brand" defaultValue={editingProduct?.brand} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                <select name="category" defaultValue={editingProduct?.category} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
               <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">HSN Code</label>
                <input name="hsnCode" defaultValue={editingProduct?.hsnCode} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Batch Number *</label>
                <input name="batchNumber" defaultValue={editingProduct?.batchNumber} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry Date *</label>
                <input type="date" name="expiryDate" defaultValue={editingProduct?.expiryDate} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Current Stock</label>
                <input type="number" name="stock" defaultValue={editingProduct?.stock || 0} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Min Stock Alert</label>
                <input type="number" name="minStock" defaultValue={editingProduct?.minStock || 10} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Selling Rate (excl. Tax) (₹)</label>
                <input type="number" step="0.01" name="rate" defaultValue={editingProduct?.rate} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">GST Rate (%)</label>
                <select name="gstRate" defaultValue={editingProduct?.gstRate || 12} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pack Size (e.g., 10 Tabs)</label>
                <input name="packSize" defaultValue={editingProduct?.packSize} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>

              <div className="col-span-2 pt-4 flex gap-3 justify-end sticky bottom-0 bg-white pb-4 sm:pb-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
                <button type="submit" className="flex-1 sm:flex-none px-6 py-3 bg-primary text-white rounded-lg hover:bg-sky-600 font-medium">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
