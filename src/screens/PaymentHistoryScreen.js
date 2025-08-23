import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedBadge,
  ThemedListItem,
  ThemedModal,
  ThemedInput,
  SegmentedControl,
  LoadingSpinner,
  SkeletonCard,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  fetchPaymentHistory,
  requestWithdrawal,
  downloadReceipt,
} from '../store/slices/paymentSlice';
import { selectUser } from '../store/slices/authSlice';
import { formatDistanceToNow, format } from 'date-fns';

const PaymentHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const {
    paymentHistory,
    balance,
    loading,
    refreshing,
  } = useSelector((state) => state.payments);
  
  const [filter, setFilter] = useState(0); // 0: All, 1: Received, 2: Sent, 3: Withdrawals
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [withdrawing, setWithdrawing] = useState(false);
  
  const filterOptions = [
    { label: 'All', key: 'all' },
    { label: 'Received', key: 'received' },
    { label: 'Sent', key: 'sent' },
    { label: 'Withdrawals', key: 'withdrawal' },
  ];
  
  const withdrawMethods = [
    { label: 'Bank Transfer', key: 'bank' },
    { label: 'Mobile Money', key: 'mobile' },
  ];
  
  useEffect(() => {
    loadPaymentHistory();
  }, []);
  
  const loadPaymentHistory = useCallback(async () => {
    try {
      await dispatch(fetchPaymentHistory(user.id)).unwrap();
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  }, [dispatch, user.id]);
  
  const handleRefresh = useCallback(async () => {
    await loadPaymentHistory();
  }, [loadPaymentHistory]);
  
  const getFilteredTransactions = () => {
    if (!paymentHistory) return [];
    
    switch (filter) {
      case 1: // Received
        return paymentHistory.filter(t => 
          t.type === 'payment_received' && t.recipientId === user.id
        );
      case 2: // Sent
        return paymentHistory.filter(t => 
          t.type === 'payment_sent' && t.senderId === user.id
        );
      case 3: // Withdrawals
        return paymentHistory.filter(t => t.type === 'withdrawal');
      default: // All
        return paymentHistory;
    }
  };
  
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment_received':
        return 'arrow-down-circle';
      case 'payment_sent':
        return 'arrow-up-circle';
      case 'withdrawal':
        return 'download';
      case 'refund':
        return 'rotate-ccw';
      case 'service_fee':
        return 'percent';
      default:
        return 'credit-card';
    }
  };
  
  const getTransactionColor = (type, userId) => {
    switch (type) {
      case 'payment_received':
        return colors.success;
      case 'payment_sent':
        return colors.warning;
      case 'withdrawal':
        return colors.primary.main;
      case 'refund':
        return colors.info;
      case 'service_fee':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };
  
  const getTransactionTitle = (transaction) => {
    switch (transaction.type) {
      case 'payment_received':
        return `Payment from ${transaction.senderName || 'User'}`;
      case 'payment_sent':
        return `Payment to ${transaction.recipientName || 'User'}`;
      case 'withdrawal':
        return 'Withdrawal';
      case 'refund':
        return 'Refund';
      case 'service_fee':
        return 'Service Fee';
      default:
        return 'Transaction';
    }
  };
  
  const getTransactionSubtitle = (transaction) => {
    if (transaction.jobTitle) {
      return `Job: ${transaction.jobTitle}`;
    }
    return transaction.description || 'No description';
  };
  
  const getTransactionAmount = (transaction) => {
    const isPositive = transaction.type === 'payment_received' || transaction.type === 'refund';
    const prefix = isPositive ? '+' : '-';
    return `${prefix}₦${transaction.amount.toLocaleString()}`;
  };
  
  const getTransactionStatus = (transaction) => {
    switch (transaction.status) {
      case 'completed':
        return { text: 'Completed', color: colors.success };
      case 'pending':
        return { text: 'Pending', color: colors.warning };
      case 'failed':
        return { text: 'Failed', color: colors.error };
      case 'cancelled':
        return { text: 'Cancelled', color: colors.text.secondary };
      default:
        return { text: transaction.status, color: colors.text.secondary };
    }
  };
  
  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };
  
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (amount > balance.available) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    
    if (amount < 100) {
      Alert.alert('Error', 'Minimum withdrawal amount is ₦100');
      return;
    }
    
    try {
      setWithdrawing(true);
      await dispatch(requestWithdrawal({
        amount,
        method: withdrawMethod,
        userId: user.id,
      })).unwrap();
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await loadPaymentHistory();
      
      Alert.alert(
        'Withdrawal Requested',
        'Your withdrawal request has been submitted. It will be processed within 1-3 business days.'
      );
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      Alert.alert('Error', 'Failed to request withdrawal. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };
  
  const handleDownloadReceipt = async (transactionId) => {
    try {
      await dispatch(downloadReceipt(transactionId)).unwrap();
      Alert.alert('Success', 'Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Alert.alert('Error', 'Failed to download receipt');
    }
  };
  
  const renderBalanceCard = () => (
    <ThemedCard style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <ThemedText variant="h6">Account Balance</ThemedText>
        <ThemedButton
          variant="primary"
          size="small"
          onPress={() => setShowWithdrawModal(true)}
          disabled={!balance?.available || balance.available < 100}
        >
          Withdraw
        </ThemedButton>
      </View>
      
      <View style={styles.balanceContent}>
        <View style={styles.balanceItem}>
          <ThemedText variant="h4" style={styles.balanceAmount}>
            ₦{balance?.available?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.balanceLabel}>
            Available Balance
          </ThemedText>
        </View>
        
        <View style={styles.balanceItem}>
          <ThemedText variant="h6" style={styles.pendingAmount}>
            ₦{balance?.pending?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.balanceLabel}>
            Pending
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.balanceStats}>
        <View style={styles.statItem}>
          <ThemedText variant="body2" style={styles.statValue}>
            ₦{balance?.totalEarned?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.statLabel}>
            Total Earned
          </ThemedText>
        </View>
        
        <View style={styles.statItem}>
          <ThemedText variant="body2" style={styles.statValue}>
            ₦{balance?.totalSpent?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.statLabel}>
            Total Spent
          </ThemedText>
        </View>
        
        <View style={styles.statItem}>
          <ThemedText variant="body2" style={styles.statValue}>
            ₦{balance?.totalWithdrawn?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.statLabel}>
            Total Withdrawn
          </ThemedText>
        </View>
      </View>
    </ThemedCard>
  );
  
  const renderTransactionItem = (transaction) => {
    const timeAgo = formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true });
    const status = getTransactionStatus(transaction);
    const isPositive = transaction.type === 'payment_received' || transaction.type === 'refund';
    
    return (
      <ThemedListItem
        key={transaction.id}
        title={getTransactionTitle(transaction)}
        subtitle={getTransactionSubtitle(transaction)}
        description={timeAgo}
        leftComponent={
          <View
            style={[
              styles.transactionIcon,
              { backgroundColor: getTransactionColor(transaction.type) + '20' },
            ]}
          >
            {/* Icon would be rendered here */}
          </View>
        }
        rightComponent={
          <View style={styles.transactionRight}>
            <ThemedText
              variant="body1"
              style={[
                styles.transactionAmount,
                { color: isPositive ? colors.status.success : colors.text.primary },
              ]}
            >
              {getTransactionAmount(transaction)}
            </ThemedText>
            <ThemedBadge
              variant="outline"
              size="small"
              style={{
                backgroundColor: status.color + '20',
                borderColor: status.color,
              }}
            >
              {status.text}
            </ThemedBadge>
          </View>
        }
        onPress={() => handleTransactionPress(transaction)}
        style={styles.transactionItem}
      />
    );
  };
  
  const renderEmptyState = () => {
    const filterText = filterOptions[filter].label.toLowerCase();
    
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          {/* Credit card icon would be rendered here */}
        </View>
        <ThemedText variant="h6" style={styles.emptyTitle}>
          No {filterText} transactions
        </ThemedText>
        <ThemedText variant="body2" style={styles.emptyMessage}>
          {filter === 0
            ? "You haven't made any transactions yet."
            : `No ${filterText} transactions found.`}
        </ThemedText>
      </View>
    );
  };
  
  const renderLoadingState = () => (
    <View style={styles.content}>
      <SkeletonCard style={styles.balanceCard} />
      {[...Array(5)].map((_, index) => (
        <SkeletonCard key={index} style={styles.skeletonTransaction} />
      ))}
    </View>
  );
  
  const filteredTransactions = getFilteredTransactions();
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Payment History"
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <ThemedButton
            variant="text"
            size="small"
            onPress={() => navigation.navigate('PaymentMethods')}
          >
            Methods
          </ThemedButton>
        }
      />
      
      {loading && !refreshing ? (
        renderLoadingState()
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderBalanceCard()}
          
          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <SegmentedControl
              segments={filterOptions}
              selectedIndex={filter}
              onSelectionChange={setFilter}
            />
          </View>
          
          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.transactionsList}>
              {filteredTransactions.map(renderTransactionItem)}
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Transaction Details Modal */}
      <ThemedModal
        visible={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
        title="Transaction Details"
        size="medium"
      >
        {selectedTransaction && (
          <View style={styles.transactionDetails}>
            <View style={styles.detailRow}>
              <ThemedText variant="body2" style={styles.detailLabel}>
                Transaction ID:
              </ThemedText>
              <ThemedText variant="body2" style={styles.detailValue}>
                {selectedTransaction.id}
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText variant="body2" style={styles.detailLabel}>
                Type:
              </ThemedText>
              <ThemedText variant="body2" style={styles.detailValue}>
                {getTransactionTitle(selectedTransaction)}
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText variant="body2" style={styles.detailLabel}>
                Amount:
              </ThemedText>
              <ThemedText variant="h6" style={styles.detailValue}>
                {getTransactionAmount(selectedTransaction)}
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText variant="body2" style={styles.detailLabel}>
                Status:
              </ThemedText>
              <ThemedBadge
                variant="outline"
                style={{
                  backgroundColor: getTransactionStatus(selectedTransaction).color + '20',
                  borderColor: getTransactionStatus(selectedTransaction).color,
                }}
              >
                {getTransactionStatus(selectedTransaction).text}
              </ThemedBadge>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText variant="body2" style={styles.detailLabel}>
                Date:
              </ThemedText>
              <ThemedText variant="body2" style={styles.detailValue}>
                {format(new Date(selectedTransaction.createdAt), 'PPpp')}
              </ThemedText>
            </View>
            
            {selectedTransaction.description && (
              <View style={styles.detailRow}>
                <ThemedText variant="body2" style={styles.detailLabel}>
                  Description:
                </ThemedText>
                <ThemedText variant="body2" style={styles.detailValue}>
                  {selectedTransaction.description}
                </ThemedText>
              </View>
            )}
            
            <View style={styles.modalActions}>
              {selectedTransaction.status === 'completed' && (
                <ThemedButton
                  variant="outline"
                  onPress={() => handleDownloadReceipt(selectedTransaction.id)}
                  style={{ marginTop: spacing[4] }}
                >
                  Download Receipt
                </ThemedButton>
              )}
            </View>
          </View>
        )}
      </ThemedModal>
      
      {/* Withdrawal Modal */}
      <ThemedModal
        visible={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setWithdrawAmount('');
        }}
        title="Withdraw Funds"
        size="medium"
      >
        <View style={styles.withdrawContent}>
          <ThemedText variant="body2" style={{ marginBottom: spacing[3] }}>
            Available Balance: ₦{balance?.available?.toLocaleString() || '0'}
          </ThemedText>
          
          <ThemedInput
            label="Amount to Withdraw"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="numeric"
            style={{ marginBottom: spacing[4] }}
          />
          
          <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
            Withdrawal Method
          </ThemedText>
          
          <SegmentedControl
            segments={withdrawMethods}
            selectedIndex={withdrawMethods.findIndex(m => m.key === withdrawMethod)}
            onSelectionChange={(index) => setWithdrawMethod(withdrawMethods[index].key)}
            style={{ marginBottom: spacing[4] }}
          />
          
          <ThemedText variant="caption" style={{ marginBottom: spacing[4], color: colors.text.secondary }}>
            • Minimum withdrawal: ₦100{"\n"}
            • Processing time: 1-3 business days{"\n"}
            • No withdrawal fees
          </ThemedText>
          
          <View style={styles.withdrawActions}>
            <ThemedButton
              variant="outline"
              onPress={() => {
                setShowWithdrawModal(false);
                setWithdrawAmount('');
              }}
              style={{ flex: 1, marginRight: spacing[2] }}
              disabled={withdrawing}
            >
              Cancel
            </ThemedButton>
            
            <ThemedButton
              variant="primary"
              onPress={handleWithdraw}
              style={{ flex: 1 }}
              loading={withdrawing}
              disabled={withdrawing || !withdrawAmount}
            >
              Withdraw
            </ThemedButton>
          </View>
        </View>
      </ThemedModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  balanceItem: {
    flex: 1,
  },
  balanceAmount: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  pendingAmount: {
    color: colors.warning,
    textAlign: 'right',
  },
  balanceLabel: {
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
  },
  statLabel: {
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  filterContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  transactionsList: {
    paddingVertical: spacing[2],
  },
  transactionItem: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: 12,
    backgroundColor: colors.background.paper,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  skeletonTransaction: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    height: 80,
  },
  transactionDetails: {
    paddingVertical: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  detailLabel: {
    color: colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    flex: 2,
    textAlign: 'right',
  },
  modalActions: {
    marginTop: spacing[2],
  },
  withdrawContent: {
    paddingVertical: spacing[2],
  },
  withdrawActions: {
    flexDirection: 'row',
  },
});

export default PaymentHistoryScreen;