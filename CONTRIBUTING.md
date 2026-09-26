# Contributing to Tempora

Thanks for helping. You can contribute in many ways: fixing a bug, adding a land, balancing an era, writing events or improving the interface.

## Getting started

You need [Node.js](https://nodejs.org/) 18 or newer. There are no dependencies to install for the game itself.

```bash
git clone https://github.com/Mofferato/tempora.git
cd tempora
node build.js        # bundles src/ into index.html
```

Open `index.html` in a browser to play your build.

To work on accounts, cloud saves or the shared community, run the platform server:

```bash
npm start
```

## Before you open a pull request

1. **Edit `src/`, not `index.html`.** `index.html` is generated.
2. **Rebuild.** Run `node build.js`, then commit the rebuilt `index.html` together with your source changes. CI fails if the two don't match.
3. **Run the tests.** Use `npm test`. It plays dozens of lives across every era, presses every button, and reports runtime errors and balance statistics. It must end with `No runtime errors.`
4. **Check balance.** If your change affects balance, run `node tools/sim.js 40 all --years 200 --quiet --typical` before and after, and mention any shift in the PR. The numbers to watch are age at death, class at 40, fame and net worth.

## How the code fits together

The Layout section of the [README](README.md#layout) lists every module. A few rules keep the game manageable:

- **The engine never touches the DOM.** Game logic lives in `Sim`, and the UI reads `Sim.W` and calls `Sim.*` actions. This is what lets `tools/sim.js` run the whole game in Node.
- **Extend through hooks.** Prefer `Sim.addHook(name, fn, mode)` over editing the core. For example, use the `mort` hook for mortality, `payMul` for pay, `odds` for event odds and `postYear` for a yearly step.
- **Register UI late.** Feature modules that add UI push to `LATE` or extend `ui.around`, `ui.worldExtra`, `ui.onAged` and similar extension points.
- **Keep content as data.** Eras, lands, jobs, events and settlements are plain tables. The README's [Adding content](README.md#adding-content) section shows the formats.
- **Show changes to the player.** A new action or event should report its effects through the normal effect keys (`fx`), so the change tags and previews work automatically.

## Writing history and cultures

Tempora covers real peoples and periods, so accuracy and respect matter:

- Prefer attested names, places and dates. When something is reconstructed, such as prehistoric personal names, say so in a comment.
- Show hardship honestly: disease, slavery, war and famine are part of the setting. Don't make any culture a caricature.
- Write your own text. Don't paste passages from books, games or websites.

## Reporting bugs and ideas

Open an [issue](https://github.com/Mofferato/tempora/issues/new/choose). For bugs, include the era, land and year, what you did, and what happened. An exported save (**Menu → Export save**) makes bugs much easier to reproduce.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
