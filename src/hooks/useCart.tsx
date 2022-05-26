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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: responseProduct } = await api.get(`/products/${productId}`);
      const { data: stock } = await api.get(`/stock/${productId}`);
      console.log(responseProduct);
      console.log(stock);

      const productInCart = cart.find((p) => p.id === productId);

      if (stock.amount === 0) {
        toast.error("Produto sem estoque");
        return;
      }
      if (productInCart) {
        if (productInCart?.amount >= stock.amount) {
          toast.error("Produto sem estoque");
        } else {
          const newCart: Product[] = cart.map((p) =>
            p.id === productId ? { ...p, amount: p.amount++ } : p
          );

          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
          toast.success("Produto adicionado ao carrinho");
        }
      }
      if (stock.amount === 0) {
        toast.error("Produto sem estoque");
      } else {
        const newProduct: Product = {
          ...responseProduct,
          amount: 1,
        };
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
        setCart([...cart, newProduct]);
        toast.success("Produto adicionado ao carrinho");
        console.log(cart);
      }
    } catch {
      toast.error("Produto não encontrado");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((p) => p.id !== productId);
      setCart(newCart);
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
