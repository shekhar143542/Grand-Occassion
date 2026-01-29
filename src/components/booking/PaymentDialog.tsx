import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Smartphone,
  Loader2,
  CheckCircle2,
  Shield,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  amount: number;
  onPaymentSuccess: () => void;
}

type PaymentMethod = 'card' | 'upi';
type ProcessingStage = 'idle' | 'validating' | 'processing' | 'success';

export function PaymentDialog({
  open,
  onOpenChange,
  bookingId,
  amount,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // UPI state
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 3 && /^\d*$/.test(value)) {
      setCvv(value);
    }
  };

  const simulatePayment = async () => {
    // Validating stage
    setProcessingStage('validating');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Processing stage
    setProcessingStage('processing');
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Success stage
    setProcessingStage('success');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Call success callback
    onPaymentSuccess();
  };

  const handlePayment = async () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
        return;
      }
    } else {
      if (!upiId && !selectedUpiApp) {
        return;
      }
    }
    
    await simulatePayment();
  };

  const resetForm = () => {
    setCardNumber('');
    setCardHolder('');
    setExpiryDate('');
    setCvv('');
    setUpiId('');
    setSelectedUpiApp('');
    setProcessingStage('idle');
  };

  const handleClose = () => {
    if (processingStage !== 'processing' && processingStage !== 'validating') {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {processingStage === 'idle' ? (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-secondary/5 to-primary/5">
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Shield className="h-6 w-6 text-secondary" />
                  Secure Payment
                </DialogTitle>
                <DialogDescription>
                  Complete your booking payment securely
                </DialogDescription>
              </DialogHeader>

              <div className="p-6">
                {/* Amount Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg border border-secondary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-secondary">₹{amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Booking ID: {bookingId.slice(0, 8)}
                  </p>
                </div>

                {/* Payment Method Tabs */}
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger value="upi" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </TabsTrigger>
                  </TabsList>

                  {/* Card Payment */}
                  <TabsContent value="card" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="flex items-center justify-between">
                        <span>Card Number</span>
                        <span className="text-xs text-muted-foreground font-normal">Carefully enter details</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          name="payment-card"
                          type="text"
                          inputMode="numeric"
                          autoComplete="new-password"
                          data-form-type="other"
                          data-lpignore="true"
                          placeholder="1234 5678 9012 3456"
                          value={formatCardNumber(cardNumber)}
                          onChange={handleCardNumberChange}
                          className="pr-10"
                          maxLength={19}
                        />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardHolder">Card Holder Name</Label>
                      <Input
                        id="cardHolder"
                        name="card-holder"
                        type="text"
                        autoComplete="new-password"
                        data-form-type="other"
                        data-lpignore="true"
                        placeholder="John Doe"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          name="card-exp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="new-password"
                          data-form-type="other"
                          data-lpignore="true"
                          placeholder="MM/YY"
                          value={formatExpiryDate(expiryDate)}
                          onChange={handleExpiryChange}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <div className="relative">
                          <Input
                            id="cvv"
                            name="card-cvc"
                            type="text"
                            inputMode="numeric"
                            autoComplete="new-password"
                            data-form-type="other"
                            data-lpignore="true"
                            placeholder="123"
                            value={cvv}
                            onChange={handleCvvChange}
                            maxLength={3}
                            className="pr-10"
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>Your payment information is encrypted and secure</span>
                    </div>
                  </TabsContent>

                  {/* UPI Payment */}
                  <TabsContent value="upi" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Choose UPI App</Label>
                        <RadioGroup value={selectedUpiApp} onValueChange={setSelectedUpiApp}>
                          <div className="grid grid-cols-2 gap-3">
                            {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                              <label
                                key={app}
                                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                  selectedUpiApp === app
                                    ? 'border-secondary bg-secondary/5'
                                    : 'border-border hover:border-secondary/50'
                                }`}
                              >
                                <RadioGroupItem value={app} id={app} />
                                <span className="text-sm font-medium">{app}</span>
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upiId">Enter UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>Instant payment confirmation via UPI</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  className="w-full mt-6 h-12 text-base font-semibold"
                  variant="gold"
                  disabled={
                    paymentMethod === 'card'
                      ? !cardNumber || !cardHolder || !expiryDate || !cvv
                      : !upiId && !selectedUpiApp
                  }
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Pay ₹{amount.toLocaleString()}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-12"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <AnimatePresence mode="wait">
                  {processingStage === 'validating' && (
                    <motion.div
                      key="validating"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="space-y-6"
                    >
                      <div className="relative w-32 h-32">
                        {/* Outer rotating ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        {/* Inner rotating ring */}
                        <motion.div
                          className="absolute inset-2 rounded-full border-4 border-blue-400 dark:border-blue-600"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                        {/* Center icon with pulse */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center shadow-lg">
                            <Shield className="h-10 w-10 text-white" />
                          </div>
                        </motion.div>
                        {/* Particles */}
                        {[0, 1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-blue-500 rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: [0, Math.cos((i * Math.PI) / 2) * 60, 0],
                              y: [0, Math.sin((i * Math.PI) / 2) * 60, 0],
                              opacity: [1, 0, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <motion.h3
                          className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Validating Payment
                        </motion.h3>
                        <p className="text-sm text-muted-foreground">
                          Verifying your payment details securely...
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {processingStage === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="space-y-6"
                    >
                      <div className="relative w-32 h-32">
                        {/* Animated gradient background */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary via-primary to-secondary"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute inset-1 rounded-full bg-background" />
                        
                        {/* Multiple rotating rings */}
                        <motion.div
                          className="absolute inset-2 rounded-full border-4 border-t-secondary border-r-transparent border-b-transparent border-l-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute inset-4 rounded-full border-4 border-t-transparent border-r-primary border-b-transparent border-l-transparent"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        />
                        
                        {/* Center icon */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-xl">
                            <CreditCard className="h-8 w-8 text-white" />
                          </div>
                        </motion.div>
                        
                        {/* Orbiting particles */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                              background: i % 2 === 0 ? 'var(--secondary)' : 'var(--primary)',
                            }}
                            animate={{
                              x: Math.cos((i * Math.PI) / 3) * 55,
                              y: Math.sin((i * Math.PI) / 3) * 55,
                              scale: [1, 1.5, 1],
                              opacity: [1, 0.5, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <motion.h3
                          className="text-2xl font-bold mb-2 bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent"
                          animate={{ 
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Processing Payment
                        </motion.h3>
                        <p className="text-sm text-muted-foreground">
                          Securing your transaction with bank...
                        </p>
                        <motion.div
                          className="mt-4 flex justify-center gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-secondary"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {processingStage === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="space-y-6"
                    >
                      <div className="relative">
                        {/* Success ring animation */}
                        <motion.div
                          className="absolute inset-0 w-32 h-32 mx-auto"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-green-500/30"
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.3, 1.3], opacity: [1, 0, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-green-500/50"
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.2, 1.2], opacity: [1, 0, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                          />
                        </motion.div>
                        
                        {/* Success icon */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 200, 
                            damping: 15,
                            delay: 0.2 
                          }}
                          className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl"
                        >
                          <motion.div
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                          >
                            <CheckCircle2 className="h-16 w-16 text-white drop-shadow-lg" />
                          </motion.div>
                        </motion.div>
                        
                        {/* Confetti particles */}
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                              background: ['#22c55e', '#16a34a', '#15803d', '#fbbf24'][i % 4],
                            }}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                              scale: [0, 1, 0],
                              x: Math.cos((i * Math.PI * 2) / 12) * 100,
                              y: Math.sin((i * Math.PI * 2) / 12) * 100,
                              opacity: [1, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: 0.5,
                              ease: 'easeOut',
                            }}
                          />
                        ))}
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                          Payment Successful!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your booking is being confirmed...
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
