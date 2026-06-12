import React, { useMemo, useState } from 'react';

import {

  ActivityIndicator,

  RefreshControl,

  ScrollView,

  StyleSheet,

  Text,

  View,

} from 'react-native';

import { RestoDashShell } from '../../src/components/restaurant-dash/RestoDashShell';

import { RestoWeekChart } from '../../src/components/restaurant-dash/RestoWeekChart';

import { useOrders } from '../../src/hooks/useOrders';

import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';

import { formatMad, isRestaurantStatsOrder } from '../../src/lib/constants';

import {

  bucketOrderCountLast7Days,

  bucketRevenueLast7Days,

  belongsToRestaurant,

  orderFoodTotal,

} from '../../src/lib/restaurantOrder';

import { brand, ink, radius, shadows } from '../../src/theme';

import { fonts } from '../../src/theme/fonts';



function StatCard({ label, value }: { label: string; value: string }) {

  return (

    <View style={[styles.card, shadows.card]}>

      <Text style={styles.cardLabel}>{label}</Text>

      <Text style={styles.cardValue}>{value}</Text>

    </View>

  );

}



export default function RestaurantStats() {

  const { restaurant, loading: restoLoading, error: restoError, refresh: refreshResto, restoId } =

    useRestaurantMe();

  const { orders, loading, refresh } = useOrders(8000);

  const [refreshing, setRefreshing] = useState(false);



  const mine = useMemo(

    () =>

      restoId

        ? orders.filter((o) => belongsToRestaurant(o, restoId) && isRestaurantStatsOrder(o))

        : [],

    [orders, restoId],

  );



  const revenue = useMemo(

    () => mine.reduce((s, o) => s + orderFoodTotal(o), 0),

    [mine],

  );



  const barData = useMemo(

    () => (restoId ? bucketOrderCountLast7Days(orders, restoId) : []),

    [orders, restoId],

  );

  const lineData = useMemo(

    () => (restoId ? bucketRevenueLast7Days(orders, restoId) : []),

    [orders, restoId],

  );



  const onRefresh = async () => {

    setRefreshing(true);

    await Promise.all([refresh(), refreshResto()]);

    setRefreshing(false);

  };



  if (restaurant === undefined || restoLoading) {

    return (

      <RestoDashShell title="Statistiques">

        <ActivityIndicator color={brand[500]} style={{ marginTop: 40 }} />

      </RestoDashShell>

    );

  }



  if (restaurant === null) {

    return (

      <RestoDashShell title="Statistiques">

        <View style={styles.noRestoBox}>

          {restoError ? <Text style={styles.error}>{restoError}</Text> : null}

          <Text style={styles.noRestoTitle}>Aucun établissement lié</Text>

          <Text style={styles.noRestoSub}>

            Les statistiques apparaîtront une fois votre restaurant configuré sur le site web.

          </Text>

        </View>

      </RestoDashShell>

    );

  }



  return (

    <RestoDashShell title="Statistiques" subtitle={restaurant.name}>

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



        {mine.length === 0 && !loading ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyTitle}>Aucune commande pour l&apos;instant</Text>

            <Text style={styles.emptySub}>

              Les graphiques se rempliront dès que des clients commanderont chez vous.

            </Text>

          </View>

        ) : null}



        <View style={styles.grid}>

          <StatCard label="Commandes" value={String(mine.length)} />

          <StatCard label="CA (plats)" value={formatMad(revenue, 0)} />

          <StatCard

            label="Livrées"

            value={String(mine.filter((o) => o.status === 'delivered').length)}

          />

          <StatCard

            label="En cours"

            value={String(mine.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length)}

          />

        </View>



        <RestoWeekChart title="Commandes par jour" data={barData} mode="count" />

        <RestoWeekChart title="CA sur 7 jours" data={lineData} mode="revenue" />

      </ScrollView>

    </RestoDashShell>

  );

}



const styles = StyleSheet.create({

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },

  card: {

    width: '47%',

    backgroundColor: '#fff',

    borderRadius: radius.lg,

    padding: 16,

    borderWidth: 1,

    borderColor: ink[100],

  },

  cardLabel: { fontSize: 12, fontFamily: fonts.semibold, color: ink[500] },

  cardValue: { marginTop: 8, fontSize: 22, fontFamily: fonts.extrabold, color: brand[600] },

  emptyBox: {

    padding: 20,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderStyle: 'dashed',

    borderColor: ink[200],

    marginBottom: 16,

  },

  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: ink[900], textAlign: 'center' },

  emptySub: {

    marginTop: 6,

    fontSize: 13,

    fontFamily: fonts.medium,

    color: ink[500],

    textAlign: 'center',

    lineHeight: 20,

  },

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


