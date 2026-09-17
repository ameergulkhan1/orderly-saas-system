"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Package,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  Send,
  Save,
} from "lucide-react";
import { ordersAPI } from "@/lib/api/orders.api";
import { productsAPI } from "@/lib/api/products.api";
import { arrayFrom } from "@/lib/api/arrayFrom";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", productId: "", productName: "", size: "", quantity: 1, price: 0 },
  ]);

  const [payment, setPayment] = useState({
    method: "COD",
    advance: 0,
    deliveryFee: 250,
  });

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);

  const totalAmount =
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
    payment.deliveryFee;
  const remainingAmount = totalAmount - payment.advance;

  // ---------- Load real products (fixed) ----------
  useEffect(() => {
    const load = async () => {
      setProductsLoading(true);
      try {
        const res = await productsAPI.list({ limit: 100 });
        const list = arrayFrom<any>(res, ["products"]);

        console.log("[orders/new] products response:", res, "→ list:", list);

        setProducts(
          list.map((p: any) => ({
            id: String(p.id),
            name: p.name ?? "Unnamed",
            price: Number(p.price ?? 0),
            stock: Number(p.currentStock ?? p.stock ?? 0),
          }))
        );
      } catch (err: any) {
        console.error("Failed to load products:", err);
        setError(
          err?.error?.message || err?.message || "Failed to load products"
        );
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), productId: "", productName: "", size: "", quantity: 1, price: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleProductSelect = (index: number, product: Product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: String(product.id),
      productName: product.name,
      price: product.price,
    };
    setItems(newItems);
    setProductSearch("");
    setShowProductDropdown(false);
    setSelectedProductIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("Please fill in customer name and phone.");
      setStep(1);
      return;
    }

    const badItem = items.find(
      (it) => !it.productId || it.quantity < 1 || it.price <= 0
    );
    if (badItem) {
      setError("Every item must be selected from the product dropdown with a quantity and price.");
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const methodMap: Record<string, string> = {
        COD: "COD",
        "Bank Transfer": "BANK_TRANSFER",
        Easypaisa: "EASYPAISA",
        JazzCash: "JAZZCASH",
        Cash: "CASH",
      };

      const res = await ordersAPI.create({
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim() || undefined,
          address: customer.address.trim() || undefined,
          city: customer.city.trim() || undefined,
        },
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
        paymentMethod: methodMap[payment.method] ?? "COD",
        deliveryFee: Number(payment.deliveryFee),
        notes: customer.notes.trim() || undefined,
        advancePayment: Number(payment.advance),
        discount: 0,
      });

      if (!res.success) {
        setError(res.error?.message || "Failed to create order");
        return;
      }

      router.push("/dashboard/orders");
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to create order. Please check all fields."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("orderDraft", JSON.stringify({ customer, items, payment }));
      alert("Order saved as draft!");
    } catch {
      alert("Failed to save draft");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/dashboard/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-sm text-gray-600">Fill in the details below to create a new order</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
            disabled={loading}
          >
            {loading ? "Creating..." : (<><Send className="mr-2 h-4 w-4" />Create Order</>)}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center gap-2 rounded-lg bg-white p-4 shadow-sm border">
        {[
          { step: 1, label: "Customer", icon: User },
          { step: 2, label: "Products", icon: Package },
          { step: 3, label: "Payment", icon: CreditCard },
        ].map((s, index) => (
          <div key={s.step} className="flex flex-1 items-center">
            <button
              onClick={() => setStep(s.step)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                step === s.step
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : step > s.step
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {step > s.step ? <span className="text-sm">✓</span> : <s.icon className="h-4 w-4" />}
              {s.label}
            </button>
            {index < 2 && (
              <div className={`mx-2 h-0.5 flex-1 ${step > s.step ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Details */}
        <div className={`rounded-xl border bg-white p-6 shadow-sm ${step !== 1 ? "opacity-60" : ""}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-600" />Customer Details
            </h2>
            {step === 1 && <Badge className="bg-blue-100 text-blue-700">Step 1</Badge>}
          </div>

          <div className={`grid gap-4 md:grid-cols-2 ${step !== 1 ? "pointer-events-none" : ""}`}>
            <div>
              <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">Customer Name *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="customerName" placeholder="Ahmed Khan" className="pl-10 h-11"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="phone" type="tel" placeholder="0300-1234567" className="pl-10 h-11"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email (Optional)</Label>
              <Input id="email" type="email" placeholder="customer@email.com" className="mt-1 h-11"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
              <Input id="city" placeholder="Rawalpindi" className="mt-1 h-11"
                value={customer.city}
                onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Delivery Address</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="address" placeholder="House #12, Street 5, Satellite Town" className="pl-10 h-11"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
              <Input id="notes" placeholder="Any special instructions or notes for this order" className="mt-1 h-11"
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="button" onClick={() => setStep(2)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow">
                Next: Add Products →
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Order Items */}
        <div className={`rounded-xl border bg-white p-6 shadow-sm ${step !== 2 ? "opacity-60" : ""}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="mr-2 h-5 w-5 text-blue-600" />Order Items
            </h2>
            {step === 2 && <Badge className="bg-blue-100 text-blue-700">Step 2</Badge>}
          </div>

          <div className={`space-y-4 ${step !== 2 ? "pointer-events-none" : ""}`}>
            {items.map((item, index) => (
              <div key={item.id} className="relative rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="relative">
                    <Label className="text-xs font-medium text-gray-500">Product *</Label>
                    <div className="relative mt-1">
                      <Input
                        placeholder={productsLoading ? "Loading products..." : "Search product..."}
                        className="h-10"
                        value={item.productName}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].productName = e.target.value;
                          newItems[index].productId = "";
                          setItems(newItems);
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                          setSelectedProductIndex(index);
                        }}
                        onFocus={() => {
                          setShowProductDropdown(true);
                          setSelectedProductIndex(index);
                        }}
                      />
                      {showProductDropdown && selectedProductIndex === index && productSearch && filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-white shadow-lg">
                          {filteredProducts.map((product) => (
                            <button key={product.id} type="button"
                              className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-blue-50"
                              onClick={() => handleProductSelect(index, product)}>
                              <span>{product.name}</span>
                              <span className="text-gray-500">Rs. {product.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {showProductDropdown && selectedProductIndex === index && productSearch && filteredProducts.length === 0 && !productsLoading && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border bg-white px-4 py-2 text-sm text-gray-500 shadow-lg">
                          No products match "{productSearch}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500">Size</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {["S", "M", "L", "XL", "One Size"].map((size) => (
                        <button key={size} type="button"
                          className={`rounded-md px-3 py-1 text-xs transition-colors ${
                            item.size === size
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          onClick={() => handleItemChange(item.id, "size", size)}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500">Quantity</Label>
                    <div className="mt-1 flex items-center gap-1">
                      <button type="button" className="rounded-l-md border border-r-0 px-3 py-1 hover:bg-gray-100"
                        onClick={() => { if (item.quantity > 1) handleItemChange(item.id, "quantity", item.quantity - 1); }}>-</button>
                      <Input type="number" min="1" className="h-8 w-16 rounded-none text-center"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)} />
                      <button type="button" className="rounded-r-md border border-l-0 px-3 py-1 hover:bg-gray-100"
                        onClick={() => handleItemChange(item.id, "quantity", item.quantity + 1)}>+</button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500">Price (Rs.)</Label>
                    <Input type="number" placeholder="0" className="mt-1 h-10"
                      value={item.price || ""}
                      onChange={(e) => handleItemChange(item.id, "price", parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                {items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(item.id)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            <button type="button" onClick={handleAddItem}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
              <Plus className="h-4 w-4" />Add Another Product
            </button>

            <div className="flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button type="button" onClick={() => setStep(3)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow">
                Next: Payment Details →
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3: Payment Details */}
        <div className={`rounded-xl border bg-white p-6 shadow-sm ${step !== 3 ? "opacity-60" : ""}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-blue-600" />Payment Details
            </h2>
            {step === 3 && <Badge className="bg-blue-100 text-blue-700">Step 3</Badge>}
          </div>

          <div className={`grid gap-6 md:grid-cols-2 ${step !== 3 ? "pointer-events-none" : ""}`}>
            <div>
              <Label className="text-sm font-medium text-gray-700">Payment Method *</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["COD", "Bank Transfer", "Easypaisa", "JazzCash", "Cash"].map((method) => (
                  <button key={method} type="button"
                    className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                      payment.method === method
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setPayment({ ...payment, method })}>
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="advance" className="text-sm font-medium text-gray-700">Advance Payment (Rs.)</Label>
                <Input id="advance" type="number" min="0" placeholder="0" className="mt-1 h-11"
                  value={payment.advance}
                  onChange={(e) => setPayment({ ...payment, advance: parseInt(e.target.value) || 0 })} />
              </div>

              <div>
                <Label htmlFor="deliveryFee" className="text-sm font-medium text-gray-700">Delivery Fee (Rs.)</Label>
                <Input id="deliveryFee" type="number" min="0" placeholder="250" className="mt-1 h-11"
                  value={payment.deliveryFee}
                  onChange={(e) => setPayment({ ...payment, deliveryFee: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-blue-600" />Order Summary
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({items.length} items)</span>
                <span className="font-medium text-gray-900">Rs. {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-medium text-gray-900">Rs. {payment.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>Total Amount</span>
                <span className="text-blue-600">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Advance Paid</span>
                <span className="font-medium text-green-600">Rs. {payment.advance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-900">{payment.method}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>Remaining</span>
                <span className={remainingAmount > 0 ? "text-red-600" : "text-green-600"}>
                  Rs. {remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow" disabled={loading}>
              {loading ? "Creating Order..." : (<><Send className="mr-2 h-4 w-4" />Create Order</>)}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}