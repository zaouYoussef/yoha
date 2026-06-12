import React, { useMemo, useState } from 'react';

import {

  ActivityIndicator,

  RefreshControl,

  ScrollView,

  StyleSheet,

  Text,

  View,

} from 'react-native';

import { RestoCancelButton } from '../../src/components/restaurant-dash/RestoCancelButton';

import { RestoDashShell } from '../../src/components/restaurant-dash/RestoDashShell';

import { RestoOrderCard } from '../../src/components/restaurant-dash/RestoOrderCard';

import { YohaButton } from '../../src/components/ui/YohaButton';

import { useOrders } from '../../src/hooks/useOrders';

import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';

import { ordersApi } from '../../src/lib/api';

import { isRestaurantActiveOrder, isRestaurantCancelledOrder } from '../../src/lib/constants';

import { belongsToRestaurant, sortOrdersNewest } from '../../src/lib/restaurantOrder';

import { brand, ink } from '../../src/theme';

import { fonts } from '../../src/theme/fonts';



function SectionTitle({ title, sub }: { title: string; sub?: string }) {

  return (

    <View style={styles.sectionHead}>

      <Text style={styles.sectionTitle}>{title}</Text>

      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}

    </View>

  );

}



export default function RestaurantIncoming() {

  const { restaurant, loading: restoLoading, error: restoError, refresh: refreshResto, restoId } =

    useRestaurantMe();

  const { orders, loading, error, refresh } = useOrders(5000);

  const [busyId, setBusyId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);



  const mine = useMemo(

    () => (restoId ? orders.filter((o) => belongsToRestaurant(o, restoId)) : []),

    [orders, restoId],

  );



  const active = useMemo(

    () => sortOrdersNewest(mine.filter((o) => isRestaurantActiveOrder(o.status))),

    [mine],

  );

  const cancelled = useMemo(

    () => sortOrdersNewest(mine.filter((o) => isRestaurantCancelledOrder(o))),

    [mine],

  );



  const updateStatus = async (orderId: string, status: string) => {

    setBusyId(orderId);

    try {

      await ordersApi.updateStatus(orderId, status);

      await refresh();

    } finally {

      setBusyId(null);

    }

  };



  const cancel = async (orderId: string, reason: string) => {

    await ordersApi.cancelOrder(orderId, reason);

    await refresh();

  };



  const onRefresh = async () => {

    setRefreshing(true);

    await Promise.all([refresh(), refreshResto()]);

    setRefreshing(false);

  };



  if (restaurant === undefined || (restoLoading && restaurant === undefined)) {

    return (

      <RestoDashShell title="Commandes entrantes">

        <ActivityIndicator color={brand[500]} style={{ marginTop: 40 }} />

      </RestoDashShell>

    );

  }



  if (restaurant === null) {

    return (

      <RestoDashShell title="Commandes entrantes">

        <View style={styles.noRestoBox}>

          {restoError ? <Text style={styles.error}>{restoError}</Text> : null}

          <Text style={styles.noRestoTitle}>Aucun établissement lié</Text>

          <Text style={styles.noRestoSub}>

            Configurez votre restaurant sur le site web YouHa pour recevoir des commandes ici.

          </Text>

        </View>

      </RestoDashShell>

    );

  }



  const renderActions = (o: (typeof active)[0]) => {

    if (o.status === 'pickup_confirmed') {

      return (

        <>

          <Text style={styles.hintSky}>🛵 Livreur en route vers vous</Text>

          <YohaButton

            title={busyId === o.id ? '…' : '✅ Accepter & préparer'}

            onPress={() => updateStatus(o.id, 'preparing')}

            loading={busyId === o.id}

          />

          <RestoCancelButton onCancel={(r) => cancel(o.id, r)} />

        </>

      );

    }

    if (o.status === 'preparing') {

      return (

        <>

          <Text style={styles.hintViolet}>

            👨‍🍳{' '}

            {o.courierName

              ? `Prête — ${o.courierName} va récupérer`

              : 'En préparation — livreur en attente'}

          </Text>

          <RestoCancelButton

            label="Annuler (avant récupération)"

            onCancel={(r) => cancel(o.id, r)}

          />

        </>

      );

    }

    return null;

  };



  return (

    <RestoDashShell

      title="Commandes entrantes"

      subtitle={restaurant.name ? `Connecté · ${restaurant.name}` : undefined}

    >

      <ScrollView

        style={{ flex: 1 }}

        contentContainerStyle={{ paddingBottom: 16 }}

        refreshControl={

          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />

        }

        showsVerticalScrollIndicator={false}

      >

        {loading && mine.length === 0 ? (

          <ActivityIndicator color={brand[500]} style={{ marginTop: 24 }} />

        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}



        <SectionTitle title="En cours" />

        {active.length === 0 && !loading ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyText}>Aucune commande active pour ce restaurant.</Text>

          </View>

        ) : (

          active.map((o) => (

            <RestoOrderCard key={o.id} order={o}>

              {renderActions(o)}

            </RestoOrderCard>

          ))

        )}



        <SectionTitle title="Annulées" sub="Annulées avant récupération par le livreur." />

        {cancelled.length === 0 ? (

          <View style={styles.emptyBoxMuted}>

            <Text style={styles.emptyText}>Aucune commande annulée.</Text>

          </View>

        ) : (

          cancelled.map((o) => (

            <RestoOrderCard key={o.id} order={o} completed />

          ))

        )}

      </ScrollView>

    </RestoDashShell>

  );

}



const styles = StyleSheet.create({

  sectionHead: { marginTop: 8, marginBottom: 12 },

  sectionTitle: { fontSize: 18, fontFamily: fonts.extrabold, color: ink[800] },

  sectionSub: { marginTop: 4, fontSize: 13, fontFamily: fonts.medium, color: ink[500] },

  emptyBox: {

    paddingVertical: 32,

    paddingHorizontal: 16,

    borderRadius: 16,

    borderWidth: 2,

    borderStyle: 'dashed',

    borderColor: ink[200],

    marginBottom: 20,

  },

  emptyBoxMuted: {

    paddingVertical: 24,

    paddingHorizontal: 16,

    borderRadius: 16,

    backgroundColor: 'rgba(248,250,252,0.8)',

    borderWidth: 1,

    borderColor: ink[100],

    marginBottom: 20,

  },

  emptyText: { textAlign: 'center', fontSize: 13, fontFamily: fonts.medium, color: ink[500] },

  hintAmber: {

    fontSize: 12,

    fontFamily: fonts.bold,

    color: '#b45309',

    textAlign: 'center',

    marginBottom: 4,

  },

  hintSky: {

    fontSize: 12,

    fontFamily: fonts.bold,

    color: '#0284c7',

    textAlign: 'center',

    marginBottom: 8,

  },

  hintViolet: {

    fontSize: 12,

    fontFamily: fonts.bold,

    color: '#7c3aed',

    textAlign: 'center',

    marginBottom: 4,

  },

  hintPink: { fontSize: 12, fontFamily: fonts.bold, color: '#db2777', textAlign: 'center' },

  error: { color: '#ef4444', marginBottom: 12, fontFamily: fonts.medium },

  noRestoBox: {

    marginTop: 32,

    padding: 20,

    borderRadius: 16,

    backgroundColor: '#fff',

    borderWidth: 1,

    borderColor: ink[200],

  },

  noRestoTitle: { fontSize: 18, fontFamily: fonts.bold, color: ink[900], textAlign: 'center' },

  noRestoSub: {

    marginTop: 8,

    fontSize: 14,

    fontFamily: fonts.medium,

    color: ink[500],

    textAlign: 'center',

    lineHeight: 22,

  },

});


