// 状態を保存する際のローカルストレージキー
const STORAGE_KEY = "life-counter-state-v2";
// プレイヤーの最大人数
const MAX_PLAYERS = 4;
// ライフ差分表示のフェードアウト時間
const LIFE_DIFF_FADE_MS = 5000;
// お知らせを自動的に隠すまでの遅延時間
const NOTICE_HIDE_DELAY = 3000;

// アプリケーションのデフォルト状態を生成する
function createDefaultState() {
	return {
		iconDisplay: "block",
		playerLayout: "2",
		initialLife: 20,
		poisonDisplay: "none",
		fullscreen: false,
		showNames: false,
		players: Array.from({ length: MAX_PLAYERS }, (_, index) => ({
			id: `player${index + 1}`,
			name: `player${index + 1}`,
			rawName: "",
			life: 20,
			poison: 0,
		})),
	};
}

// 状態オブジェクトをディープコピーする
function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

// ログ用に現在時刻をフォーマットする
function formatTime() {
	const now = new Date();
	const pad = (value) => value.toString().padStart(2, "0");
	return `${pad(now.getHours())}時${pad(now.getMinutes())}分${pad(now.getSeconds())}秒`;
}

class LifeCounterApp {
	// 画面要素の参照取得と初期化処理を行う
	constructor() {
		this.state = cloneState(createDefaultState());
		this.damageLog = `start at ${formatTime()}\n`;
		this.diffTotals = new Array(MAX_PLAYERS).fill(0);
		this.diffTimers = new Array(MAX_PLAYERS).fill(null);
		this.swipeStart = null;

		this.mainElement = document.querySelector("main");
		this.settingsPanel = document.querySelector(".settings-block");
		this.settingsBackdrop = document.querySelector(".settings-bg");
		this.settingsForm = document.querySelector(".setting-form");
		this.notice = document.querySelector(".notice");
		this.menuSettings = document.querySelector(".menu .settings");
		this.reloadButton = document.querySelector(".reload");
		this.resetSettingsButton = document.querySelector(".setting-reflesh");
		this.nameInputs = Array.from(
			document.querySelectorAll("#name-input input"),
		);
		this.playerElements = Array.from(document.querySelectorAll(".player"));

		this.loadState();
		this.applyState();
		this.registerEventListeners();
		this.setupResizeObserver();
		this.hideNoticeLater();
	}

	// 保存済み状態を読み込む。なければ既定値やレガシーデータから復元する
	loadState() {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				this.state = this.mergeWithDefaults(parsed);
				return;
			} catch (error) {
				console.warn(
					"Failed to parse stored state, falling back to defaults.",
					error,
				);
			}
		}

		if (localStorage.getItem("setSave")) {
			this.state = this.migrateLegacyState();
			return;
		}

		this.state = cloneState(createDefaultState());
	}

	// 旧バージョンのローカルストレージ構造から最新構造へデータを移行する
	migrateLegacyState() {
		const defaults = createDefaultState();
		const state = cloneState(defaults);

		state.iconDisplay =
			localStorage.getItem("iconDisp") || defaults.iconDisplay;
		state.playerLayout =
			localStorage.getItem("playerNumber") || defaults.playerLayout;
		const storedInitLife = parseInt(localStorage.getItem("initLife"), 10);
		state.initialLife = Number.isFinite(storedInitLife)
			? storedInitLife
			: defaults.initialLife;
		state.poisonDisplay =
			localStorage.getItem("poisonDisp") || defaults.poisonDisplay;
		const nameDispRaw = localStorage.getItem("nameDisp");
		state.showNames = nameDispRaw === "1";
		const fullscreenRaw = localStorage.getItem("switchScreen");
		state.fullscreen = fullscreenRaw === "set";

		for (let index = 0; index < MAX_PLAYERS; index += 1) {
			const lifeKey = `playerLife[${index}]`;
			const poisonKey = `playerPoison[${index}]`;
			const nameKey = `nameInput[${index}]`;
			const storedLife = parseInt(localStorage.getItem(lifeKey), 10);
			const storedPoison = parseInt(localStorage.getItem(poisonKey), 10);
			const storedName = localStorage.getItem(nameKey);

			const player = state.players[index];
			player.life = Number.isFinite(storedLife)
				? storedLife
				: state.initialLife;
			player.poison = Number.isFinite(storedPoison)
				? Math.max(0, storedPoison)
				: 0;
			if (storedName) {
				player.rawName = storedName;
				player.name = storedName;
			}
		}

		return state;
	}

	// 保存済みの部分的な状態をデフォルト値とマージする
	mergeWithDefaults(partial) {
		const defaults = createDefaultState();
		const state = cloneState(defaults);

		state.iconDisplay =
			typeof partial.iconDisplay === "string"
				? partial.iconDisplay
				: defaults.iconDisplay;
		state.playerLayout =
			typeof partial.playerLayout === "string"
				? partial.playerLayout
				: defaults.playerLayout;
		state.initialLife = Number.isFinite(partial.initialLife)
			? Math.trunc(partial.initialLife)
			: defaults.initialLife;
		state.poisonDisplay =
			typeof partial.poisonDisplay === "string"
				? partial.poisonDisplay
				: defaults.poisonDisplay;
		state.fullscreen = Boolean(partial.fullscreen);
		state.showNames = Boolean(partial.showNames);

		const players = Array.isArray(partial.players) ? partial.players : [];
		for (let index = 0; index < MAX_PLAYERS; index += 1) {
			const fallback = defaults.players[index];
			const incoming = players[index] || {};
			const life = Number.isFinite(incoming.life)
				? Math.trunc(incoming.life)
				: fallback.life;
			const poison = Number.isFinite(incoming.poison)
				? Math.max(0, Math.trunc(incoming.poison))
				: fallback.poison;
			const rawName =
				typeof incoming.rawName === "string"
					? incoming.rawName
					: fallback.rawName;
			const displayName = rawName && rawName.trim() ? rawName : fallback.name;

			state.players[index] = {
				id: fallback.id,
				life,
				poison,
				rawName,
				name:
					typeof incoming.name === "string" && incoming.name.trim()
						? incoming.name
						: displayName,
			};
		}

		return state;
	}

	// 現在の状態をローカルストレージへ保存する
	saveState() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
		} catch (error) {
			console.warn("Failed to persist state.", error);
		}
	}

	// UI 全体に必要なイベントリスナーを登録する
	registerEventListeners() {
		if (this.menuSettings) {
			this.menuSettings.addEventListener("click", () => {
				if (this.settingsPanel?.classList.contains("active")) {
					this.closeSettings();
				} else {
					this.openSettings();
				}
			});
			this.menuSettings.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					if (this.settingsPanel?.classList.contains("active")) {
						this.closeSettings();
					} else {
						this.openSettings();
					}
				}
			});
		}

		if (this.settingsBackdrop) {
			this.settingsBackdrop.addEventListener("click", () =>
				this.closeSettings(),
			);
		}

		document.addEventListener("keydown", (event) => this.handleKeydown(event));

		if (this.settingsForm) {
			this.settingsForm.addEventListener("click", (event) => {
				const button = event.target.closest("button.button");
				if (!button) {
					return;
				}
				event.preventDefault();
				this.handleSettingsButton(button);
			});
		}

		if (this.reloadButton) {
			this.reloadButton.addEventListener("click", () => {
				this.withTemporaryClass(
					this.reloadButton.querySelector("i"),
					"fa-spin-fast",
					500,
				);
				this.resetLife();
			});
		}

		if (this.resetSettingsButton) {
			this.resetSettingsButton.addEventListener("click", () => {
				this.resetSettings();
				this.withTemporaryClass(
					this.resetSettingsButton.querySelector("i"),
					"fa-jump",
					1000,
				);
			});
		}

		this.nameInputs.forEach((input, index) => {
			input.addEventListener("input", () =>
				this.updatePlayerName(index, input.value),
			);
		});

		this.playerElements.forEach((playerElement, index) => {
			const upper = playerElement.querySelector(".upperside");
			const lower = playerElement.querySelector(".lowerside");
			const poison = playerElement.querySelector(".poison");

			if (upper) {
				upper.addEventListener("pointerdown", (event) => {
					if (!event.isPrimary || event.button !== 0) {
						return;
					}
					event.preventDefault();
					this.adjustLife(index, 1);
				});
			}

			if (lower) {
				lower.addEventListener("pointerdown", (event) => {
					if (!event.isPrimary || event.button !== 0) {
						return;
					}
					event.preventDefault();
					this.adjustLife(index, -1);
				});
			}

			if (poison) {
				poison.addEventListener("pointerdown", (event) => {
					if (!event.isPrimary || event.button !== 0) {
						return;
					}
					event.preventDefault();
					this.adjustPoison(index, 1, { wrap: true });
				});
			}
		});

		window.addEventListener("pointerdown", (event) => {
			// if (event.pointerType !== "touch") {
			// 	return;
			// }
			this.swipeStart = { x: event.clientX, y: event.clientY };
		}, { capture: true }); // キャプチャフェーズで登録

		window.addEventListener("pointerup", (event) => {
			// if (!this.swipeStart || event.pointerType !== "touch") {
			// 	return;
			// }
			const deltaX = event.clientX - this.swipeStart.x;
			const deltaY = Math.abs(event.clientY - this.swipeStart.y);
			if (Math.abs(deltaX) > 60 && deltaY < 40) {
				if (deltaX > 0) {
					this.openSettings();
				} else {
					this.closeSettings();
				}
			}
			this.swipeStart = null;
		});
		
		window.addEventListener("pointercancel", () => {
			this.swipeStart = null;
		});

		document.addEventListener("fullscreenchange", () => {
			const isFullscreen = Boolean(document.fullscreenElement);
			if (this.state.fullscreen !== isFullscreen) {
				this.state.fullscreen = isFullscreen;
				this.updateSettingsUI();
				this.saveState();
			}
		});
	}

	// リサイズや画面回転に応じてフォントサイズを調整する
	setupResizeObserver() {
		const update = () => this.updateFonts();
		update();

		if (typeof ResizeObserver !== "undefined") {
			const observer = new ResizeObserver(update);
			observer.observe(this.mainElement);
			this.resizeObserver = observer;
		} else {
			window.addEventListener("resize", update);
			window.addEventListener("orientationchange", update);
		}
	}

	// 初回表示時の案内を一定時間後に自動で非表示にする
	hideNoticeLater() {
		if (!this.notice) {
			return;
		}
		window.setTimeout(() => {
			this.notice.classList.add("is-hidden");
		}, NOTICE_HIDE_DELAY);
	}

	// 設定パネル内の各ボタン押下時に対応する状態変更を適用する
	handleSettingsButton(button) {
		const listItem = button.closest("li");
		if (listItem) {
			const container = listItem.closest(".setting-input");
			if (container) {
				container
					.querySelectorAll("li")
					.forEach((item) => item.classList.remove("active"));
			}
			listItem.classList.add("active");
		}

		if (button.dataset.icon_disp) {
			this.setIconDisplay(button.dataset.icon_disp);
		} else if (button.dataset.player_number) {
			this.setPlayerLayout(button.dataset.player_number);
		} else if (button.dataset.life_amount) {
			this.setInitialLife(parseInt(button.dataset.life_amount, 10));
		} else if (button.dataset.poison_counter) {
			this.setPoisonDisplay(button.dataset.poison_counter);
		} else if (button.dataset.set_fullscreen) {
			this.setFullscreenPreference(button.dataset.set_fullscreen);
		} else if (button.dataset.name_disp) {
			this.setNameDisplay(button.dataset.name_disp === "1");
		}
	}

	// キーボード操作でライフ調整などを行う
	handleKeydown(event) {
		if (event.ctrlKey || event.metaKey || event.altKey) {
			return;
		}
		if (this.settingsPanel && this.settingsPanel.classList.contains("active")) {
			if (event.key === "Escape") {
				this.closeSettings();
			}
			return;
		}

		switch (event.key) {
			case "a":
				this.adjustLife(0, -1);
				event.preventDefault();
				break;
			case "s":
				this.adjustLife(0, 1);
				event.preventDefault();
				break;
			case "j":
				this.adjustLife(1, -1);
				event.preventDefault();
				break;
			case "k":
				this.adjustLife(1, 1);
				event.preventDefault();
				break;
			case "r":
				this.resetLife();
				event.preventDefault();
				break;
			case "q":
				this.adjustPoison(0, -1);
				event.preventDefault();
				break;
			case "w":
				this.adjustPoison(0, 1);
				event.preventDefault();
				break;
			case "u":
				this.adjustPoison(1, -1);
				event.preventDefault();
				break;
			case "i":
				this.adjustPoison(1, 1);
				event.preventDefault();
				break;
			default:
				break;
		}
	}

	// 設定メニューの表示有無を切り替える
	setIconDisplay(value) {
		this.state.iconDisplay = value === "none" ? "none" : "block";
		this.applyIconDisplay();
		this.saveState();
	}

	// プレイヤーレイアウト（人数表示）を更新する
	setPlayerLayout(layout) {
		this.state.playerLayout = layout;
		this.applyPlayerLayout();
		this.saveState();
		this.updateFonts();
	}

	// 初期ライフ値を更新する
	setInitialLife(life) {
		if (!Number.isFinite(life)) {
			return;
		}
		this.state.initialLife = Math.max(0, Math.trunc(life));
		this.saveState();
	}

	// 毒カウンターの表示有無を切り替える
	setPoisonDisplay(display) {
		this.state.poisonDisplay = display === "block" ? "block" : "none";
		this.applyPoisonDisplay();
		this.saveState();
	}

	// フルスクリーン表示の希望を設定しブラウザ API を呼び出す
	async setFullscreenPreference(mode) {
		const shouldEnable = mode === "set";
		this.state.fullscreen = shouldEnable;
		this.updateSettingsUI();
		this.saveState();

		if (shouldEnable) {
			if (!document.fullscreenElement) {
				try {
					await document.documentElement.requestFullscreen();
				} catch (error) {
					console.warn("Fullscreen request was denied.", error);
					this.state.fullscreen = false;
					this.updateSettingsUI();
					this.saveState();
				}
			}
		} else if (document.fullscreenElement) {
			await document.exitFullscreen();
		}
	}

	// プレイヤー名表示のオン／オフを設定する
	setNameDisplay(show) {
		this.state.showNames = Boolean(show);
		this.applyNameDisplay();
		this.saveState();
	}

	// 入力フォームからプレイヤー名を更新する
	updatePlayerName(index, rawValue) {
		if (!this.state.players[index]) {
			return;
		}
		const trimmed = rawValue.trim();
		const fallback = this.state.players[index].id;
		this.state.players[index].rawName = rawValue;
		this.state.players[index].name = trimmed || fallback;
		this.updatePlayerDisplay(index);
		this.saveState();
	}

	// すべてのプレイヤーのライフと毒を初期値へ戻す
	resetLife() {
		this.damageLog = `start at ${formatTime()}\n`;
		this.diffTotals.fill(0);
		this.clearAllDiffs();

		this.state.players.forEach((player) => {
			player.life = this.state.initialLife;
			player.poison = 0;
		});

		this.updateAllPlayers();
		this.saveState();
		console.log(this.damageLog);
	}

	// 設定をデフォルト値に戻しつつ現在のライフ状況を維持する
	resetSettings() {
		const preservedPlayers = this.state.players.map((player, index) => ({
			id: `player${index + 1}`,
			life: player.life,
			poison: player.poison,
		}));

		const defaults = createDefaultState();
		this.state = cloneState(defaults);
		this.state.players.forEach((player, index) => {
			player.life = preservedPlayers[index].life;
			player.poison = preservedPlayers[index].poison;
		});

		this.nameInputs.forEach((input, index) => {
			input.value = "";
			this.state.players[index].rawName = "";
			this.state.players[index].name = this.state.players[index].id;
		});

		this.applyState();
		this.saveState();
	}

	// 指定したプレイヤーのライフを増減させる
	adjustLife(index, delta) {
		const player = this.state.players[index];
		if (!player) {
			return;
		}
		player.life += delta;
		this.diffTotals[index] += delta;
		this.updatePlayerDisplay(index);
		this.showLifeDiff(index);
		this.saveState();
		this.logLifeChange(player.name, delta, player.life);
	}

	// 指定したプレイヤーの毒カウンターを増減させる
	adjustPoison(index, delta, options = {}) {
		const player = this.state.players[index];
		if (!player) {
			return;
		}
		const { wrap = false } = options;
		const maxPoison = 10;
		let nextValue = player.poison + delta;

		if (wrap) {
			if (nextValue > maxPoison) {
				nextValue = 0;
			} else if (nextValue < 0) {
				nextValue = maxPoison;
			}
		} else {
			nextValue = Math.max(0, Math.min(maxPoison, nextValue));
		}

		nextValue = Math.max(0, Math.min(maxPoison, nextValue));

		if (nextValue === player.poison) {
			return;
		}

		player.poison = nextValue;
		this.updatePlayerDisplay(index);
		this.saveState();
		this.logPoisonChange(player.name, delta, player.poison);
	}

	// ライフ変化の差分を一定時間表示する
	showLifeDiff(index) {
		const playerElement = this.playerElements[index];
		if (!playerElement) {
			return;
		}
		const diffContainer = playerElement.querySelector(".diff");
		const diffValueElement = playerElement.querySelector(".diffp");
		if (!diffContainer || !diffValueElement) {
			return;
		}

		const diff = this.diffTotals[index];
		const formatted = diff > 0 ? `+${diff}` : `${diff}`;
		diffValueElement.textContent = formatted;

		diffContainer.classList.remove("is-visible");
		// Force reflow to restart the animation.
		void diffContainer.offsetWidth; // eslint-disable-line no-unused-expressions
		diffContainer.classList.add("is-visible");

		window.clearTimeout(this.diffTimers[index]);
		this.diffTimers[index] = window.setTimeout(() => {
			this.diffTotals[index] = 0;
			diffValueElement.textContent = "0";
			diffContainer.classList.remove("is-visible");
		}, LIFE_DIFF_FADE_MS);
	}

	// ライフ差分の表示をリセットする
	clearAllDiffs() {
		this.playerElements.forEach((playerElement, index) => {
			const diffContainer = playerElement.querySelector(".diff");
			const diffValueElement = playerElement.querySelector(".diffp");
			if (diffContainer && diffValueElement) {
				diffContainer.classList.remove("is-visible");
				diffValueElement.textContent = "0";
			}
			window.clearTimeout(this.diffTimers[index]);
		});
	}

	// ライフ変化の履歴を記録する
	logLifeChange(name, delta, total) {
		const diff = delta > 0 ? `+${delta}` : `${delta}`;
		const entry = `${formatTime()} ${name} ${diff} ： 計${total}`;
		this.damageLog += `${entry}\n`;
		console.log(entry);
	}

	// 毒カウンター変化の履歴を記録する
	logPoisonChange(name, delta, total) {
		const diff = delta > 0 ? `+${delta}` : `${delta}`;
		const entry = `${formatTime()} ${name} ${diff}毒 ： 計${total}毒`;
		this.damageLog += `${entry}\n`;
		console.log(entry);
	}

	// 指定クラスを一定時間だけ付与してアニメーションを実行する
	withTemporaryClass(element, className, duration) {
		if (!element) {
			return;
		}
		element.classList.add(className);
		window.setTimeout(() => {
			element.classList.remove(className);
		}, duration);
	}

	// 現在の状態をもとに UI 全体を反映する
	applyState() {
		this.applyIconDisplay();
		this.applyPlayerLayout();
		this.applyPoisonDisplay();
		this.applyNameDisplay();
		this.updateAllPlayers();
		this.updateSettingsUI();
		this.updateFonts();
	}

	// メニューアイコンの表示設定を UI に反映する
	applyIconDisplay() {
		if (!this.menuSettings) {
			return;
		}
		this.menuSettings.style.display =
			this.state.iconDisplay === "none" ? "none" : "";
	}

	// プレイヤー配置に対応するクラスを main 要素へ付与する
	applyPlayerLayout() {
		if (!this.mainElement) {
			return;
		}
		const layoutClassPrefix = "player-number-";
		const classesToRemove = Array.from(this.mainElement.classList).filter(
			(className) => className.startsWith(layoutClassPrefix),
		);
		classesToRemove.forEach((className) =>
			this.mainElement.classList.remove(className),
		);
		this.mainElement.classList.add(
			`${layoutClassPrefix}${this.state.playerLayout}`,
		);
	}

	// 毒カウンター表示設定を各プレイヤー要素へ反映する
	applyPoisonDisplay() {
		this.playerElements.forEach((playerElement) => {
			const poison = playerElement.querySelector(".poison");
			if (poison) {
				poison.style.display = this.state.poisonDisplay;
			}
		});
	}

	// プレイヤー名の表示状態を body のクラスで切り替える
	applyNameDisplay() {
		document.body.classList.toggle("show-names", this.state.showNames);
	}

	// すべてのプレイヤー表示を現在の状態で更新する
	updateAllPlayers() {
		this.state.players.forEach((_, index) => this.updatePlayerDisplay(index));
	}

	// 指定プレイヤーのライフ・毒・名前表示を更新する
	updatePlayerDisplay(index) {
		const player = this.state.players[index];
		const element = this.playerElements[index];
		if (!player || !element) {
			return;
		}
		const lifeElement = element.querySelector(".life");
		const poisonElement = element.querySelector(".poison");
		const nameElement = element.querySelector(".name");

		if (lifeElement) {
			lifeElement.textContent = player.life;
		}
		if (poisonElement) {
			poisonElement.textContent = player.poison;
		}
		if (nameElement) {
			nameElement.textContent = player.name;
		}
		if (this.nameInputs[index]) {
			this.nameInputs[index].value = this.state.players[index].rawName;
		}
	}

	// 設定パネルのアクティブ状態を UI に反映する
	updateSettingsUI() {
		this.setActiveSetting(
			"icon-disp",
			`[data-icon_disp="${this.state.iconDisplay}"]`,
		);
		this.setActiveSetting(
			"player-number",
			`[data-player_number="${this.state.playerLayout}"]`,
		);
		this.setActiveSetting(
			"life-amount",
			`[data-life_amount="${this.state.initialLife}"]`,
		);
		this.setActiveSetting(
			"poison-counter",
			`[data-poison_counter="${this.state.poisonDisplay}"]`,
		);
		this.setActiveSetting(
			"set-fullscreen",
			`[data-set_fullscreen="${this.state.fullscreen ? "set" : "cancel"}"]`,
		);
		this.setActiveSetting(
			"name-disp",
			`[data-name_disp="${this.state.showNames ? "1" : "0"}"]`,
		);

		if (this.menuSettings) {
			this.menuSettings.setAttribute(
				"aria-expanded",
				this.settingsPanel.classList.contains("active") ? "true" : "false",
			);
		}
	}

	// 設定グループ内で対象ボタンをアクティブ表示にする
	setActiveSetting(groupId, selector) {
		const group = document.getElementById(groupId);
		if (!group) {
			return;
		}
		const container = group.querySelector(".setting-input");
		if (!container) {
			return;
		}
		const button = container.querySelector(selector);
		if (!button) {
			return;
		}
		container
			.querySelectorAll("li")
			.forEach((item) => item.classList.remove("active"));
		const listItem = button.closest("li");
		if (listItem) {
			listItem.classList.add("active");
		}
	}

	// 要素サイズに応じたフォントサイズを計算して適用する
	updateFonts() {
		window.requestAnimationFrame(() => {
			this.playerElements.forEach((playerElement, index) => {
				const lifeElement = playerElement.querySelector(".life");
				const diffElement = playerElement.querySelector(".diff");
				const nameElement = playerElement.querySelector(".name");
				const guides = playerElement.querySelectorAll(".guide");
				const poisonElement = playerElement.querySelector(".poison");

				const rect = playerElement.getBoundingClientRect();
				const size = Math.min(rect.width, rect.height);
				if (!size || !lifeElement) {
					return;
				}

				const lifeValue = Math.abs(this.state.players[index]?.life ?? 0);
				lifeElement.style.fontSize = `${size * (lifeValue >= 100 ? 0.6 : 0.8)}px`;

				if (diffElement) {
					diffElement.style.fontSize = `${size * 0.1}px`;
					diffElement.style.marginTop = `${-size * 0.1}px`;
				}

				if (nameElement) {
					nameElement.style.fontSize = `${size * 0.1}px`;
				}

				guides.forEach((guide) => {
					guide.style.fontSize = `${size * 0.1}px`;
				});

				if (poisonElement) {
					poisonElement.style.fontSize = `${size * 0.25}px`;
				}
			});
		});
	}

	// 設定パネルを開いて UI 表示を切り替える
	openSettings() {
		if (!this.settingsPanel || !this.mainElement) {
			return;
		}
		this.settingsPanel.classList.add("active");
		this.mainElement.classList.add("active");
		if (this.settingsBackdrop) {
			this.settingsBackdrop.style.display = "block";
		}
		const icon = this.menuSettings?.querySelector("i");
		this.withTemporaryClass(icon, "fa-spin", 600);
		if (this.menuSettings) {
			this.menuSettings.setAttribute("aria-expanded", "true");
		}
	}

	// 設定パネルを閉じて UI 表示を元に戻す
	closeSettings() {
		if (!this.settingsPanel || !this.mainElement) {
			return;
		}
		this.settingsPanel.classList.remove("active");
		this.mainElement.classList.remove("active");
		if (this.settingsBackdrop) {
			this.settingsBackdrop.style.display = "none";
		}
		if (this.menuSettings) {
			this.menuSettings.setAttribute("aria-expanded", "false");
		}
	}
}

// DOM が準備できたらアプリケーションを起動する
window.addEventListener("DOMContentLoaded", () => {
	new LifeCounterApp();
});
