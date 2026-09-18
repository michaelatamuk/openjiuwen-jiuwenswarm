package com.jiuwenswarm.study.data

import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

class Repo(private val db: AppDatabase) {

    val json = Json { ignoreUnknownKeys = true }

    val topics: Flow<List<TopicEntity>> = db.topics().observeAll()

    fun questionsForTopic(topicId: String): Flow<List<QuestionEntity>> =
        db.questions().observeByTopic(topicId)

    fun question(id: String): Flow<QuestionEntity?> = db.questions().observeById(id)

    fun card(id: String): Flow<CardEntity?> = db.cards().observeById(id)

    fun search(q: String): Flow<List<QuestionEntity>> = db.questions().search(q)

    fun dueCount(now: Long): Flow<Int> = db.cards().observeDueCount(now)
    fun newCount(): Flow<Int> = db.cards().observeNewCount()
    fun learnedCount(): Flow<Int> = db.cards().observeLearnedCount()
    fun mastery(): Flow<Double?> = db.cards().observeMastery()
    fun reviewsSince(since: Long): Flow<Int> = db.reviewLog().observeReviewsSince(since)
    fun totalReviews(): Flow<Int> = db.reviewLog().observeTotalReviews()
    fun activeDays(): Flow<Int> = db.reviewLog().observeActiveDays()

    fun anchors(q: QuestionEntity): List<AnchorDto> =
        runCatching { json.decodeFromString<List<AnchorDto>>(q.anchorsJson) }.getOrDefault(emptyList())

    fun bookmarkIds(): Flow<List<String>> = db.bookmarks().observeIds()

    suspend fun toggleBookmark(questionId: String, on: Boolean) {
        if (on) db.bookmarks().remove(questionId)
        else db.bookmarks().add(BookmarkEntity(questionId, System.currentTimeMillis()))
    }

    fun note(questionId: String): Flow<NoteEntity?> = db.notes().observe(questionId)

    suspend fun saveNote(questionId: String, text: String) {
        if (text.isBlank()) db.notes().delete(questionId)
        else db.notes().upsert(NoteEntity(questionId, text, System.currentTimeMillis()))
    }

    /** Build today's queue: due review cards first, then a few new cards. */
    suspend fun buildQueue(maxDue: Int = 30, maxNew: Int = 8): List<StudyItem> {
        val now = System.currentTimeMillis()
        val out = ArrayList<StudyItem>()
        for (c in db.cards().dueCards(now, maxDue)) {
            db.questions().byId(c.questionId)?.let { out.add(StudyItem(it, c)) }
        }
        for (c in db.cards().newCards(maxNew)) {
            db.questions().byId(c.questionId)?.let { out.add(StudyItem(it, c)) }
        }
        return out
    }

    suspend fun rate(questionId: String, rating: Int) {
        val now = System.currentTimeMillis()
        val card = db.cards().byId(questionId) ?: CardEntity(questionId = questionId)
        val r = Fsrs.schedule(card, rating, now)
        db.cards().update(
            card.copy(
                state = r.state, stability = r.stability, difficulty = r.difficulty,
                due = r.due, lastReview = now, reps = r.reps, lapses = r.lapses,
                elapsedDays = r.elapsedDays, scheduledDays = r.scheduledDays,
            )
        )
        db.reviewLog().insert(
            ReviewLogEntity(
                questionId = questionId, rating = rating, reviewedAt = now,
                stateBefore = card.state, stateAfter = r.state,
            )
        )
    }
}

data class StudyItem(val question: QuestionEntity, val card: CardEntity)
