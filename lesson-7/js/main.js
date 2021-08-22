'use strict';
const cartGoods = [];

const searchForm = {
    name: 'search-form',
    data: () => ({
        searchLine: '',
    }),
    template: `
        <form class="search-form" @input.prevent="filterGoods">
            <input type="text" placeholder="Поиск товаров" class="goods-search" v-model.trim="searchLine">
        </form>
    `,
    methods: {
        filterGoods(){
            this.$emit('filter-goods', this.searchLine);
        }
    },
};

const goodsItem = {
    name: 'goods-item',
    props: ['good'],
    template: `<div class="goods-item">
                    <img src="https://via.placeholder.com/150" alt="img" class="goods-img">
                    <h3 class="title goods-title">{{ good.product_name }}</h3>
                    <p>{{ good.price }}₽</p>
                    <button class="add-to-cart" @click="addGoodToCart(good)">В корзину</button>
                </div>`,
            methods: {
                addGoodToCart(good) {
                    this.$emit('add-cart', good);
                },
            }
        };

const goodsList = {
    name: 'goods-list',
    props: ['goods'],
    components: {
        goodsItem,
    },
    template: `
            <div class="goods-list" v-if="!isGoodsEmpty">
                <goods-item v-for="good in goods" :good="good" :key="good.id_product" @add-cart="addCart"></goods-item>
            </div>
            <div class="goods-not-found" v-else><h2>Нет товаров</h2></div>
            `,
    methods: {
        addCart(good) {
            this.$emit('add-cart', good);
        }
    },
    computed: {
        isGoodsEmpty(){
            return this.goods.length === 0;
        },
    },
};

const cart = {
    name: 'cart',
    props: ['isVisibleCart'],
    data: () =>({
        cartGoods: cartGoods,
    }),
    template: `
    <transition name="fade">
    <div class="cart" v-if="isVisibleCart">
        <div class="cart-container">
            <span class="closer" @click="hideCart"></span>
            <table class="title-cart">
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Цена</th>
                        <th>Кол-во</th>
                        <th></th>
                    </tr>
                    <tr class="cart-good" v-for="cartGood in cartGoods" :key="cartGood.id_product">
                        <td class="cart-name">{{ cartGood.product_name }}</td>
                        <td class="cart-price">{{ cartGood.price }}</td>
                        <td class="cart-count">{{ cartGood.count }}</td>
                        <td>
                            <span class="inc-good" @click="incCartGood(cartGood)"><i class="fa fa-plus" aria-hidden="true"></i></span>
                            <span class="dec-good" @click="decCartGood(cartGood)"><i class="fa fa-minus" aria-hidden="true"></i></span>
                        </td>
                    </tr>
                </thead>
                <tbody class="cart-items"></tbody>
            </table>
            <div class="block-button">
            <span class="cart-sum">Общая стоимость товаров: {{ cartSum }}₽</span>
            </div>
        </div>
    </div>
    </transition>
    `,
    methods: {
        hideCart(){
            this.$emit('hide-cart');
        },
        incCartGood(good){
            this.$emit('increment-cart', good);
        },
        decCartGood(good){
            this.$emit('decrement-cart', good);
        },
    },
    computed:{
        cartSum(){
            let sum=0;
            this.cartGoods.forEach(elem => sum += elem.price * elem.count);
            return sum;
        },
    },
};

const queryNotFound = {
    name: 'query-not-found',
    props:['queryerror'],
    template: `
           <div class="query-not-found">
                <h3>Не удалось выполнить запрос к серверу</h3>
                <p>{{queryerror}}</p>
            </div>
    `,
};

const app = new Vue({
    el: '#app',
    data: {
        goods: [],
        searchAllRegExp: /\w*/,
        filterElem: '',
        isVisibleCart: false,
        isQuerySuccess: false,
        queryError: '',
    },
    components: {
        searchForm,
        goodsList,
        cart,
        queryNotFound,
    },
    methods: {
        makeGetRequest(url) {
            return new Promise((resolve, reject) => {
                let xhr;
                if (window.XMLHttpRequest) {
                    xhr = new window.XMLHttpRequest();
                } else  {
                    xhr = new window.ActiveXObject("Microsoft.XMLHTTP")
                }

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            reject(xhr.responseText);
                        }
                        const body = JSON.parse(xhr.responseText);
                        resolve(body)
                    }
                };

                xhr.onerror = function (err) {
                    reject(err)
                };

                xhr.open('GET', url);
                xhr.send();
            });
        },
        makePostRequest(url, data){
            return new Promise((resolve, reject) => {
                let xhr;
                if (window.XMLHttpRequest) {
                    xhr = new window.XMLHttpRequest();
                } else {
                    xhr = new window.ActiveXObject('Microsoft.XMLHTTP');
                }

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        resolve(xhr.responseText);
                    }
                };
                xhr.open('POST', url);
                xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
                xhr.send(data);
            });
        },
       async addGoodToCart(good) {
            let goodElem = this.findGoodItem(good.id_product);
            if ( goodElem >= 0){
                cartGoods[goodElem].count++;
            } else {
                const cartItem = Object.assign({}, good, {count: 1});
                cartGoods.push(cartItem);
            }
            await this.makePostRequest('/api/addCart', JSON.stringify(cartGoods));
        },
        async removeGoodInCart(good){
            const goodElem = this.findGoodItem(good.id_product);
              if (cartGoods[goodElem].count > 1) {
                  cartGoods[goodElem].count--;
              }else{
                  cartGoods.splice(goodElem, 1);
              };
                await this.makePostRequest('/api/removeCart', JSON.stringify(cartGoods));
        },
        findGoodItem(id_product){
            let goodId = -1;
            cartGoods.forEach((item, index) => {
                if (item.id_product == id_product) {
                    goodId = index;
                }
            });
            return goodId;
        },
        toggleCart(){
            this.isVisibleCart = !this.isVisibleCart;
        },
        filterGoods(elem){
            this.filterElem = elem;
         }
    },
    async mounted() {
        Promise.all([this.makeGetRequest(`/api/goods`),
            this.makeGetRequest(`/api/cart`)
        ]).then(([catalogData, cartData])=> {
            this.goods = catalogData;
            cartGoods.push(...cartData);
            this.isQuerySuccess = true;
        }).catch((event) => {
            this.isQuerySuccess = false;
            this.queryerror = event.name + ":" + event.message;
            console.error(event);
        });
    },
    computed: {
        filteredGoods() {
            let filterRegExp;
            this.searchAllRegExp.lastIndex = 0;
            const regStars = /\*+/gi;
            const regPluses = /\++/gi;
            if (this.searchAllRegExp.test(this.filterElem) &&
                !regStars.test(this.filterElem) &&
                !regPluses.test(this.filterElem)) {
                filterRegExp = new RegExp(`${this.filterElem}`, 'gi');
            } else {
                filterRegExp = this.searchAllRegExp;
            }
                return this.goods.filter(good => filterRegExp.test(good.product_name));
        }
    }
});
