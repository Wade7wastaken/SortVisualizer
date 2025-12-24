//@ts-check

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number[]}
 */
function randomArray(n, min, max) {
	return Array.from(
		{ length: n },
		() => Math.floor(Math.random() * (max - min + 1)) + min
	);
}

class Stats {
	reads;
	writes;
	swaps;
	text;

	/**
	 * @param {Element} text
	 */
	constructor(text) {
		this.reads = 0;
		this.writes = 0;
		this.swaps = 0;
		this.text = text;
		this.update_text();
	}

	update_text() {
		this.text.textContent = `Reads: ${this.reads}, Writes: ${this.writes}, Swaps: ${this.swaps}`;
	}

	add_read() {
		this.reads++;
		this.update_text();
	}
	add_write() {
		this.writes++;
		this.update_text();
	}
	add_swap() {
		this.swaps++;
		this.update_text();
	}
}

class ArraySort {
	/** @type {Element} */
	#container;

	/** @type {Stats} */
	#stats;

	/** @type {number[]} */
	#arr;

	/** @type {HTMLSpanElement[]} */
	#bars;

	/** @type {number} */
	#max;

	/**
	 * @param {Element} container
	 * @param {number} n
	 * @param {number} min
	 * @param {number} max
	 * @param {string} title
	 */
	constructor(container, n, min, max, title) {
		this.#container = container;
		this.#arr = randomArray(n, min, max);
		this.#bars = [];
		this.#max = max;

		this.#container.innerHTML = "";
		this.#container.classList.add("sortContainer");

		const info = document.createElement("p");
		this.#stats = new Stats(info);

		const label = document.createElement("p");
		label.classList.add("title");
		label.textContent = title;

		const field = document.createElement("div");
		field.classList.add("sortField");

		for (const x of this.#arr) {
			const el = document.createElement("span");
			el.className = "bar";
			el.style.height = `${(x / max) * 100}%`;
			field.appendChild(el);
			this.#bars.push(el);
		}

		this.#container.appendChild(label);
		this.#container.appendChild(info);
		this.#container.appendChild(field);
	}

	length() {
		return this.#arr.length;
	}

	/**
	 * @param {number} i
	 * @param {number} x
	 */
	#set_internal(i, x) {
		this.#arr[i] = x;
		this.#bars[i].style.height = `${(x / this.#max) * 100}%`;
	}

	/**
	 * @param {number} i
	 * @returns {number}
	 */
	get(i) {
		this.#stats.add_read();
		return this.#arr[i];
	}

	/**
	 * @param {number} i
	 * @param {number} x
	 */
	set(i, x) {
		this.#stats.add_write();
		this.#set_internal(i, x);
	}

	/**
	 * @param {number} a
	 * @param {number} b
	 */
	swap(a, b) {
		this.#stats.add_swap();
		let temp = this.#arr[a];
		this.#set_internal(a, this.#arr[b]);
		this.#set_internal(b, temp);
	}

	/**
	 * @param {number} a
	 * @param {number} b
	 */
	copy(a, b) {
		this.#stats.add_read();
		this.#stats.add_write();
		this.#set_internal(a, this.#arr[b]);
	}
}

/**
 * @param {ArraySort} arr
 */
function* bubble(arr) {
	for (let i = 0; i < arr.length(); i++) {
		for (let j = 0; j < arr.length() - i - 1; j++) {
			if (arr.get(j) > arr.get(j + 1)) {
				yield arr.swap(j, j + 1);
			}
		}
	}
}

/**
 * @param {ArraySort} arr
 * @param {number} low
 * @param {number} high
 * @returns {Generator<void, void, void>}
 */
function* quick(arr, low = 0, high = arr.length() - 1) {
	if (low < high) {
		const pivot = arr.get(high);
		let i = low - 1;

		for (let j = low; j < high; j++) {
			if (arr.get(j) < pivot) {
				i++;
				yield arr.swap(i, j);
			}
		}

		yield arr.swap(i + 1, high);

		const pivotIndex = i + 1;

		for (const x of quick(arr, low, pivotIndex - 1)) {
			yield x;
		}
		for (const x of quick(arr, pivotIndex + 1, high)) {
			yield x;
		}
	}
}

/**
 * @param {ArraySort} arr
 * @returns {Generator<void, void, void>}
 */
function* shell(arr) {
	const n = arr.length();

	for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
		for (let i = gap; i < n; i++) {
			const temp = arr.get(i);
			let j = i;
			for (; j >= gap && arr.get(j - gap) > temp; j -= gap)
				yield arr.copy(j, j - gap);

			yield arr.set(j, temp);
		}
	}
}

/**
 *
 * @param {ArraySort} array
 * @param {number} index
 * @param {number} heapSize
 * @returns {Generator<void, void, void>}
 */
function* heapify(array, index, heapSize) {
	let largest = index;
	const left = 2 * index + 1;
	const right = 2 * index + 2;
	if (left < heapSize && array.get(left) > array.get(largest)) {
		largest = left;
	}
	if (right < heapSize && array.get(right) > array.get(largest)) {
		largest = right;
	}
	if (largest !== index) {
		yield array.swap(index, largest);
		for (const x of heapify(array, largest, heapSize)) {
			yield x;
		}
	}
}

/**
 * @param {ArraySort} array
 * @returns
 */
function* heap(array) {
	for (let i = Math.floor(array.length() / 2) - 1; i >= 0; i--) {
		for (const x of heapify(array, i, array.length())) {
			yield x;
		}
	}
	for (let i = array.length() - 1; i > 0; i--) {
		yield array.swap(0, i);
		for (const x of heapify(array, 0, i)) {
			yield x;
		}
	}
}

/**
 * @param {ArraySort} arr
 * @param {number} left
 * @param {number} right
 */
function* insertion(arr, left = 0, right = arr.length()) {
	for (let i = left + 1; i < right; i++) {
		let key = arr.get(i);
		let j = i - 1;
		while (j >= left && arr.get(j) > key) {
			yield arr.copy(j + 1, j);
			j--;
		}
		yield arr.set(j + 1, key);
	}
}

/**
 * @param {ArraySort} arr
 * @param {number} left
 * @param {number} mid
 * @param {number} right
 */
function* mergeInPlace(arr, left, mid, right) {
	let i = left;
	let j = mid;
	while (i < j && j < right) {
		if (arr.get(i) <= arr.get(j)) {
			i++;
		} else {
			const value = arr.get(j);
			for (let k = j; k > i; k--) {
				yield arr.copy(k, k - 1);
			}
			yield arr.set(i, value);
			i++;
			j++;
			mid++;
		}
	}
}

/**
 * @param {ArraySort} arr
 */
function* block(arr) {
	const n = arr.length();

	const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));

	for (let start = 0; start < n; start += blockSize) {
		for (const x of quick(arr, start, Math.min(start + blockSize, n))) {
			yield x;
		}
	}

	for (let size = blockSize; size < n; size *= 2) {
		for (let left = 0; left < n; left += 2 * size) {
			const mid = Math.min(left + size, n);
			const right = Math.min(left + 2 * size, n);
			if (mid < right) {
				for (const x of mergeInPlace(arr, left, mid, right)) {
					yield x;
				}
			}
		}
	}
}

/**
 * @param {Generator<void, void, void>[]} gens
 */
function* combineGens(...gens) {
	while (true) {
		let res = gens.map((x) => x.next());
		if (res.every((x) => x.done ?? false)) {
			return;
		}
		yield;
	}
}

/**
 *
 * @param {string} id
 * @returns {Element}
 */
function getIdSafe(id) {
	let el = document.getElementById(id);
	if (el == null) {
		throw new Error(`couldn't find element with id ${id}`);
	}
	return el;
}

/**
 *
 * @param {string} id
 * @param {string} title
 * @returns {ArraySort}
 */
function attachSorter(id, title) {
	let el = getIdSafe(id);
	let numElements = getIdSafe("numElements");
	// @ts-ignore
	return new ArraySort(el, numElements.value, 1, 1000, title);
}

const start = getIdSafe("start");
const reset = getIdSafe("reset");
const numElements = getIdSafe("numElements");
const sleepTime = getIdSafe("sleepTime");

function main() {
	const sort1 = attachSorter("sort1", "Quicksort");
	const sort2 = attachSorter("sort2", "Shell sort");
	const sort3 = attachSorter("sort3", "Heap sort");

	const s1 = quick(sort1);
	const s2 = shell(sort2);
	const s3 = heap(sort3);
	const combined = combineGens(s1, s2, s3);

	let sorting = false;

	//@ts-ignore
	start.onclick = async () => {
		if (sorting) {
			return;
		}
		sorting = true;
		for (const _ of combined) {
			if (!sorting) {
				return;
			}
			// @ts-ignore
			await sleep(sleepTime.value);
		}
		sorting = false;
	};

	const onUpdateSettings = () => {
		sorting = false;
		main();
	};

	//@ts-ignore
	reset.onclick = onUpdateSettings;

	//@ts-ignore
	numElements.onchange = onUpdateSettings;
}

main();
