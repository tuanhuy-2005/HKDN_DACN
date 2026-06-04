import type { MenuItem } from '@/lib/api'

export interface CartItem {
  menu_item_id: number
  name: string
  price: number
  quantity: number
  category: string
  image_url: string | null
}

const CART_KEY = 'cafe_cart'
const cartListeners = new Set<() => void>()

function canUseStorage(): boolean {
  return 'localStorage' in globalThis
}

function notifyCartListeners(): void {
  cartListeners.forEach((listener) => listener())
}

export function subscribeCart(listener: () => void): () => void {
  cartListeners.add(listener)
  return () => {
    cartListeners.delete(listener)
  }
}

export function getCart(): CartItem[] {
  if (!canUseStorage()) return []
  const raw = localStorage.getItem(CART_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (!canUseStorage()) return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  notifyCartListeners()
}

export function addToCart(item: MenuItem, quantity = 1): void {
  const cart = getCart()
  const index = cart.findIndex((cartItem) => cartItem.menu_item_id === item.id)
  if (index >= 0) {
    cart[index] = {
      ...cart[index],
      quantity: cart[index].quantity + quantity,
    }
  } else {
    cart.push({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      category: item.category,
      image_url: item.image_url,
    })
  }
  saveCart(cart)
}

export function updateCartItemQuantity(menuItemId: number, quantity: number): void {
  const nextCart = getCart()
    .map((item) => (item.menu_item_id === menuItemId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0)
  saveCart(nextCart)
}

export function removeCartItem(menuItemId: number): void {
  saveCart(getCart().filter((item) => item.menu_item_id !== menuItemId))
}

export function clearCart(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(CART_KEY)
  notifyCartListeners()
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0)
}
