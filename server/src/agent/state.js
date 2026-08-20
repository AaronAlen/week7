import { Annotation } from '@langchain/langgraph';

export const RestockStateAnnotation = Annotation.Root({
  productId: Annotation({ reducer: (x, y) => y ?? x }),
  productName: Annotation({ reducer: (x, y) => y ?? x }),
  sku: Annotation({ reducer: (x, y) => y ?? x }),
  currentStock: Annotation({ reducer: (x, y) => y ?? x }),
  safetyThreshold: Annotation({ reducer: (x, y) => y ?? x }),
  targetStock: Annotation({ reducer: (x, y) => y ?? x }),
  unitCost: Annotation({ reducer: (x, y) => y ?? x }),
  supplierName: Annotation({ reducer: (x, y) => y ?? x }),
  supplierEmail: Annotation({ reducer: (x, y) => y ?? x }),
  supplierPhone: Annotation({ reducer: (x, y) => y ?? x }),
  calculatedReorderQty: Annotation({ reducer: (x, y) => y ?? x }),
  totalCost: Annotation({ reducer: (x, y) => y ?? x }),
  requiresHumanReview: Annotation({ reducer: (x, y) => y ?? x }),
  isApproved: Annotation({ reducer: (x, y) => y ?? x }),
  restockRequestId: Annotation({ reducer: (x, y) => y ?? x }),
  threadId: Annotation({ reducer: (x, y) => y ?? x }),
  status: Annotation({ reducer: (x, y) => y ?? x }),
  logs: Annotation({ reducer: (x, y) => (x || []).concat(y || []) })
});
