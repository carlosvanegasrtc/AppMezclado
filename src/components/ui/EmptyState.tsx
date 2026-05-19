import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { Colors } from '@constants/colors';
import { IconDefaults } from '@config/icons';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        {icon ?? (
          <Inbox
            size={36}
            color={Colors.slate[400]}
            strokeWidth={IconDefaults.strokeWidth}
          />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && <View style={styles.actionWrap}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate[700],
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.slate[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  actionWrap: { marginTop: 8 },
});
