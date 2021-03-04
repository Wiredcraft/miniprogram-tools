const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

Component({
  data: {
    name: "hello",
  },

  methods: {
    async onLoad() {
      console.log("onLoad", this.is);
      await sleep(1000);
      console.log("after 1000 ms");
    },

    handleTapCheckout(e: WechatMiniprogram.BaseEvent) {
      console.log(e.currentTarget.dataset);
    },
  },
});
