import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // localStorage.setItem("@RocketShoes:cart", JSON.stringify([]));
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [cart];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: responseProduct } = await api.get(`/products/${productId}`);
      const { data: stock } = await api.get(`/stock/${productId}`);

      console.log(stock);

      const getProducts = localStorage.getItem("@RocketShoes:cart");

      const products: Product[] = getProducts ? JSON.parse(getProducts) : [];
      const productInCart = products.find((p) => p.id === productId);

      const verifyCartAndStock = (): boolean => {
        if (productInCart) {
          if (productInCart.amount >= stock.amount) {
            return false;
          }
        } else {
          return false;
        }
        return true;
      };

      if (stock.amount > 0 && verifyCartAndStock()) {
        const newCart: Product[] = cart.map((p) =>
          p.id === productId ? { ...p, amount: p.amount + 1 } : p
        );

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

        toast.success("Produto adicionado ao carrinho");
      } else if (!productInCart && stock.amount > 0) {
        const newProduct: Product = {
          ...responseProduct,
          amount: 1,
        };
        const newCart: Product[] = [...cart, newProduct];

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        toast.success("Produto adicionado ao carrinho");
      } else {
        toast.error("Produto sem estoque");
      }
    } catch {
      toast.error("Produto não encontrado");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((p) => p.id !== productId);
      setCart((prev) => newCart);
      toast.success("Produto removido com sucesso");
    } catch {
      toast.error("Produto não encontrado");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`/stock/${productId}`);

      if (amount > stock.amount) {
        toast.error("Produto sem estoque");
      } else {
        const newCart = cart.map((p) =>
          p.id === productId ? { ...p, amount } : p
        );

        setCart(newCart);
        toast.success("Produto atualizado com sucesso");
      }
    } catch {
      toast.error("Produto não encontrado");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
