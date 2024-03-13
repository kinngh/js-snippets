import { EventEmitter } from "events";

/**
 * Represents a timeout error when a task exceeds the allotted time.
 */
class TimeoutError extends Error {
  /**
   * Creates an instance of a TimeoutError.
   * @param {string} message - The error message.
   */
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * A task queue that supports concurrency control, timeouts, and prioritization.
 */
class TaskQueue extends EventEmitter {
  /**
   * Constructs a new TaskQueue instance.
   * @param {Object} [options={}] - Configuration options for the task queue.
   * @param {number} [options.concurrency=Infinity] - Maximum number of concurrent tasks.
   * @param {number} [options.timeout=0] - Timeout for each task in milliseconds.
   * @param {boolean} [options.throwOnTimeout=false] - Whether to throw an error when a task times out.
   * @param {boolean} [options.autoStart=true] - Whether to start processing tasks as soon as they're added.
   */
  constructor({
    concurrency = Infinity,
    timeout = 0,
    throwOnTimeout = false,
    autoStart = true,
  } = {}) {
    super();
    this.concurrency = concurrency;
    this.timeout = timeout;
    this.throwOnTimeout = throwOnTimeout;
    this.autoStart = autoStart;
    this.taskQueue = [];
    this.runningTasks = 0;
    this.paused = !autoStart;
  }

  /**
   * Executes a task, applying a timeout if specified.
   * @param {Function} task - The task function to execute.
   * @param {Function} resolve - The function to call on task completion.
   * @param {Function} reject - The function to call on task failure.
   */
  async runTask(task, resolve, reject) {
    this.runningTasks++;
    this.emit("active");

    try {
      let result;
      if (this.timeout > 0) {
        result = await this.withTimeout(task, this.timeout);
      } else {
        result = await task();
      }
      resolve(result);
      this.emit("completed", result);
    } catch (error) {
      reject(error);
      this.emit("error", error);
    } finally {
      this.runningTasks--;
      if (!this.paused) {
        this.processQueue();
      }
      if (this.taskQueue.length === 0 && this.runningTasks === 0) {
        this.emit("idle");
      }
      this.emit("next");
    }
  }

  /**
   * Wraps a task with a timeout.
   * @param {Function} task - The task function to wrap.
   * @param {number} timeout - The timeout in milliseconds.
   * @returns {Promise} A promise that either resolves with the task result or rejects on timeout.
   */
  withTimeout(task, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError("Operation timed out"));
      }, timeout);

      task()
        .then(resolve, reject)
        .finally(() => clearTimeout(timer));
    });
  }

  /**
   * Adds a task to the queue with an optional priority.
   * @param {Function} task - The task function to add.
   * @param {Object} [options={}] - Task options.
   * @param {number} [options.priority=0] - Priority of the task. Lower numbers indicate higher priority.
   * @returns {Promise} A promise that resolves when the task is completed.
   */
  add(task, { priority = 0 } = {}) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject, priority });
      this.taskQueue.sort((a, b) => a.priority - b.priority);
      this.emit("add");

      if (this.autoStart && !this.paused) {
        this.processQueue();
      }
    });
  }

  /**
   * Processes the queued tasks according to the concurrency setting.
   */
  processQueue() {
    while (
      !this.paused &&
      this.runningTasks < this.concurrency &&
      this.taskQueue.length
    ) {
      const { task, resolve, reject } = this.taskQueue.shift();
      this.runTask(task, resolve, reject);
    }
  }

  /**
   * Pauses the processing of tasks, preventing new tasks from starting.
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resumes the processing of tasks, allowing new tasks to start.
   */
  start() {
    if (this.paused) {
      this.paused = false;
      this.processQueue();
    }
  }

  /**
   * Clears all tasks from the queue.
   */
  clear() {
    this.taskQueue = [];
  }

  /**
   * Returns a promise that resolves when the queue becomes empty.
   * @returns {Promise} A promise that resolves when no tasks are left in the queue.
   */
  onEmpty() {
    return new Promise((resolve) => {
      if (this.taskQueue.length === 0) {
        resolve();
      } else {
        this.once("empty", resolve);
      }
    });
  }

  /**
   * Returns a promise that resolves when all tasks have been processed and the queue is idle.
   * @returns {Promise} A promise that resolves when the queue is idle.
   */
  onIdle() {
    return new Promise((resolve) => {
      if (this.taskQueue.length === 0 && this.runningTasks === 0) {
        resolve();
      } else {
        this.once("idle", resolve);
      }
    });
  }
}

export default TaskQueue;

// Usage

// Simulate an API call with a random delay to represent network latency
const mockApiCall = (name, delay) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`${name} completed`);
      resolve(`${name} result`);
    }, delay);
  });
};

// Create a new task queue with a concurrency limit of 2 and a timeout of 8000 milliseconds
const queue = new TaskQueue({
  concurrency: 2,
  timeout: 8000,
  throwOnTimeout: true,
  autoStart: false,
});

// Add event listeners to the queue to track its activity
queue.on("active", () => console.log("Task started"));
queue.on("completed", (result) =>
  console.log(`Task completed with result: ${result}`)
);
queue.on("error", (error) =>
  console.error(`Task failed with error: ${error.message}`)
);
queue.on("idle", () => console.log("Queue is idle"));
// queue.on("add", () => console.log("Task added to the queue"));

// Add tasks to the queue with varying priorities and simulated delays
queue.add(() => mockApiCall("Task 1", 1000), { priority: 2 });
queue.add(() => mockApiCall("Task 2", 1000), { priority: 1 });
queue.add(() => mockApiCall("Task 3", 1000), { priority: 2 });
queue.add(() => mockApiCall("Task 4", 1000), { priority: 1 });
queue.add(() => mockApiCall("Task 5", 1000), { priority: 2 });
queue.add(() => mockApiCall("Task 6", 1000), { priority: 1 });
queue.add(() => mockApiCall("Task 7", 1000), { priority: 2 });
queue.add(() => mockApiCall("Task 8", 1000), { priority: 1 });

// Manually start the queue since autostart is set to false
queue.start();

// Wait for the queue to become empty
queue.onEmpty().then(() => console.log("Queue is empty"));

// Wait for all tasks to complete
queue.onIdle().then(() => console.log("All tasks have been completed"));

/*
Logs:
- Task started
- Task started
- Task 2 completed
- Task completed with result: Task 2 result
- Task started
- Task 4 completed
- Task completed with result: Task 4 result
- Task started
- Task 6 completed
- Task completed with result: Task 6 result
- Task started
- Task 8 completed
- Task completed with result: Task 8 result
- Task started
- Task 1 completed
- Task completed with result: Task 1 result
- Task started
- Task 3 completed
- Task completed with result: Task 3 result
- Task started
- Task 5 completed
- Task completed with result: Task 5 result
- Task 7 completed
- Task completed with result: Task 7 result
- Queue is idle
- All tasks have been completed
 */