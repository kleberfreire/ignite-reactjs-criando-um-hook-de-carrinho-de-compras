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
  function addLocalStorage(product: Product[]): void {
    const cartLocalStorage = localStorage.getItem("@RocketShoes:cart");
    const cartParse = cartLocalStorage ? JSON.parse(cartLocalStorage) : [];
    const newCart = [...cartParse, product];
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
  }

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const productExists = updateCart.find((p) => p.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (productExists) {
        if (productExists.amount > stockAmount) {
          toast.error("Quantidade solicitada fora do estoque");
          return;
        }
        if (productExists.amount >= stockAmount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          productExists.amount += 1;
        }
      } else {
        if (stockAmount <= 0) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          const response = await api.get(`/products/${productId}`);
          const data = response.data;
          const newProduct = { ...data, amount: 1 };

          updateCart.push(newProduct);
        }
      }

      setCart(updateCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
    } catch (error) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const produtoExists = cart.find((p) => p.id === productId);
      if (produtoExists) {
        const newCart = cart.filter((p) => p.id !== productId);
        setCart(newCart);
        toast.success("Produto removido com sucesso");
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        toast.error("Erro na remoção do produto");
        return;
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`/stock/${productId}`);

      const updateCart = [...cart];
      const amountStock = responseStock.data.amount;
      const productExists = updateCart.find((p) => p.id === productId);

      if (!productExists) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      if (amount > amountStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (amount <= 0) {
        return;
      }

      productExists.amount = amount;

      setCart(updateCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      toast.success("Produto atualizado com sucesso");
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
